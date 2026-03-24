import net from "node:net";

globalThis.ByondEpochTimeOffset =
  new Date("2000-01-01T00:00:00Z").getTime() / 1000;

// cosplay of Microsoft
class ByondChannel {
  constructor(game_server) {
    this.server = game_server;
    this.con_string = null;
    this.socket = null;
    this.reconnect_timer = null;
    this.keep_alive_interval = null;
    this.queue_interval = null;
    this.notified = false;
    this._recvBuffer = Buffer.alloc(0);
    this.pending = new Map(); // req_id -> {id,resolve,reject,string_request,retries,timeout,sent}
    this.request_counter = 1;
    this.default_retries = 2;
    this.default_timeout = 15 * 1000;
    this.reconnect_attempt = 0;
  }

  connect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }

    const [host, port] = this.con_string.split(":");
    this.socket = net.connect(Number.parseInt(port), host);
    this.socket.on("connect", () => {
      this.reconnect_attempt = 0;
      this.keep_alive_interval = setInterval(() => this.ping(), 30000);
      this.queue_interval = setInterval(() => {
        this.processQueue();
      }, 1000);
      console.log(`ByondAPI >> [INFO] >> Connected to ${this.con_string}`);
    });

    this.socket.on("data", (data) => {
      this._onSocketData(data);
    });

    this.socket.on("error", () => {
      if (this.reconnect_attempt) return;
      if (!this.keep_alive_interval)
        this.disconnect(
          `ByondAPI >> [WARNING] >> Can't connect to ${this.con_string}`,
        );
    });

    this.socket.on("close", (hadError) => {
      if (this.reconnect_attempt) {
        this.attemptReconnect();
        return;
      }
      this.disconnect(
        `ByondAPI >> [WARNING] >> ${hadError ? "Error caused closing connection" : "Connection closed"} to ${this.con_string}`,
      );
    });
  }

  checkData() {
    const current_string = `${this.server.data.ip}:${this.server.data.port}`;
    if (this.con_string != current_string) {
      this.con_string = current_string;
      this.attemptReconnect();
      return false;
    }
    return true;
  }

  async ping() {
    if (!this.checkData()) return;
    const result = await this.request(
      { query: "ping", auth: "anonymous" },
      { timeout: 5000, retries: 5 },
    );
    if (result) return;
    this.disconnect(
      `ByondAPI >> [WARNING] >> Due to failed pings assuming connection lost to ${this.con_string}`,
    );
  }

  disconnect(message) {
    if (message) {
      console.log(message);
    }
    clearInterval(this.keep_alive_interval);
    clearInterval(this.queue_interval);
    this.attemptReconnect();
  }

  attemptReconnect() {
    if (this.reconnect_timer) return;
    if (!this.checkData()) return;
    let time = Math.min(6 * ++this.reconnect_attempt, 120);
    if (this.reconnect_attempt <= 20 || !(this.reconnect_attempt % 10))
      console.log(
        `ByondAPI >> Failed connection to ${this.con_string}, attempt ${this.reconnect_attempt}. Reconnecting in ${time}s...`,
      );
    this.reconnect_timer = setTimeout(() => {
      this.reconnect_timer = null;
      this.connect();
    }, 1000 * time);
  }

  _onSocketData(data) {
    this._recvBuffer = Buffer.concat([this._recvBuffer, data]);
    while (this._recvBuffer.length >= 4) {
      // Оглавление
      if (!this._recvBuffer.subarray(0, 2).equals(Buffer.from([0x00, 0x83]))) {
        // Кто я, откуда я??? (не бульен); дропаем байт для ресинхронизации
        this._recvBuffer = this._recvBuffer.subarray(1);
        continue;
      }
      const size = this._recvBuffer.readUInt16BE(2);
      const frame_len = 4 + size;
      if (this._recvBuffer.length < frame_len) break; // ожидаем полного ответа
      const byte_response = this._recvBuffer.subarray(4, 4 + size);
      this._recvBuffer = this._recvBuffer.subarray(frame_len);
      this._handleFrame(byte_response);
    }
  }

  _handleFrame(byte_response) {
    const packet_type = byte_response[0]; // Тип полученого пакета
    let response = null;
    if (packet_type === 0x2a) {
      console.log("ByondAPI >> [DEBUG] >> received float frame");
      return;
    } else if (packet_type === 0x06 || packet_type === 0x0) {
      response = byte_response.slice(1, byte_response.length).toString("ascii");
      if (response.length && response.codePointAt(response.length - 1) === 0) {
        response = response.slice(0, -1);
      }
    } else {
      console.log(
        `ByondAPI >> [ERROR] >> Unknown BYOND data code: 0x${packet_type.toString(16)}`,
      );
      return;
    }

    if (!isJsonString(response)) return;

    let json_response = JSON.parse(response);
    if (!json_response.req_id || !this.pending.has(json_response.req_id))
      return;

    const entry = this.pending.get(json_response.req_id);
    clearTimeout(entry.timer);

    if (json_response.statuscode === 202) {
      entry.timer = setTimeout(() => {
        if (!this.pending.has(entry.id)) return;
        if (entry.retries-- == 0) this.timeoutEntry(entry);

        this.pending.delete(entry.id);
        const request = JSON.parse(entry.string_request);
        request.req_id = `${Date.now()}-${this.request_counter++}`;
        entry.id = request.req_id;
        entry.string_request = JSON.stringify(request);
        this.pending.set(request.req_id, entry);
      }, entry.timeout);
      return;
    }

    if (
      json_response.statuscode != null &&
      json_response.statuscode != 200 &&
      json_response.statuscode < 500
    ) {
      if (globalThis._LogsHandler) {
        globalThis._LogsHandler.sendSimplyLog("Byond API", null, null, [
          { name: "Target", value: `${this.con_string}` },
          { name: "Received", value: response },
          { name: "Sent", value: entry.string_request },
          {
            name: "Created at",
            value: `<t:${Math.floor((entry.created - new Date().getTimezoneOffset() * 60000) / 1000)}:t>`,
          },
        ]);
      }
      clearTimeout(entry.timer);
      clearTimeout(entry.final_timeout);
      entry.reject();
      this.pending.delete(json_response.req_id);
      return;
    }

    clearTimeout(entry.timer);
    clearTimeout(entry.final_timeout);
    entry.resolve(json_response);
    this.pending.delete(json_response.req_id);
  }

  processQueue() {
    for (const [, entry] of this.pending) {
      if (entry.sent) continue;

      const text_encoder = new TextEncoder();
      const encoded_text = text_encoder.encode(entry.string_request);
      const length = encoded_text.length + 7; // 7 байт: 2 для типа пакета (0, 131), 2 для длины, 1 для нулевого байта в конце, 1 байт для кода пакета и 1 байт для завершающего нуля

      const packet = new Uint8Array(length + 4);
      packet.set(
        [0, 131, (length >> 8) & 0xff, length & 0xff, 0, 0, 0, 0, 0, 63],
        0,
      );
      packet.set(encoded_text, 10);
      packet[length + 3] = 0;

      try {
        this.socket.write(packet);

        entry.sent = true;
        clearTimeout(entry.timer);
        entry.timer = setTimeout(() => {
          if (entry.retries-- == 0) this.timeoutEntry(entry);
          entry.sent = false;
        }, entry.timeout);
      } catch {
        if (entry.retries-- == 0) this.timeoutEntry(entry);
      }
    }
  }

  // Возвращает обещание, прям как депутаты и президенты
  async request(request, options) {
    request.source = "DiscordBot";
    request.req_id = `${Date.now()}-${this.request_counter++}`;
    const entry = {
      id: request.req_id,
      created: Date.now(),
      resolve: null,
      reject: null,
      string_request: JSON.stringify(request),
      retries: options.retries ?? this.default_retries,
      timeout: options.timeout ?? this.default_timeout,
      sent: false,
    };

    entry.final_timeout = setTimeout(
      () => this.timeoutEntry(entry),
      entry.timeout * entry.retries,
    );
    this.pending.set(entry.id, entry);
    try {
      return await new Promise((resolve, reject) => {
        entry.resolve = resolve;
        entry.reject = reject;
      });
    } catch {
      return;
    }
  }

  timeoutEntry(entry) {
    clearTimeout(entry.timer);
    clearTimeout(entry.final_timeout);
    if (globalThis._LogsHandler && !this.reconnect_attempt) {
      // If bot on server reboot spam with that, youre doing something wrong on byond side
      globalThis._LogsHandler.sendSimplyLog("Byond API", null, null, [
        { name: "Target", value: `${this.con_string}` },
        { name: "Received", value: "Timeout" },
        { name: "Sent", value: entry.string_request },
        {
          name: "Created at",
          value: `<t:${Math.floor((entry.created - new Date().getTimezoneOffset() * 60000) / 1000)}:t>`,
        },
      ]);
    }
    entry.reject();
    this.pending.delete(entry.id);
  }
}

export default function declareByondApi() {
  globalThis.discord_client.createByondChannel = async function (game_server) {
    game_server.byond_channel = new ByondChannel(game_server);
    game_server.byond_channel.con_string = `${game_server.data.ip}:${game_server.data.port}`;
    game_server.byond_channel.connect();
  };
}

function isJsonString(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
