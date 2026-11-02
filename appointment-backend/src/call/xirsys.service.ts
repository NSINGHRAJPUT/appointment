import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

@Injectable()
export class XirsysService {
  private readonly logger = new Logger(XirsysService.name);

  async getIceServers(): Promise<IceServer[]> {
    const path = (process.env.XIRSYS_PATH ?? 'https://global.xirsys.net').replace(
      /\/$/,
      '',
    );
    const ident = process.env.XIRSYS_IDENT;
    const secret = process.env.XIRSYS_SECRET;
    const channel = process.env.XIRSYS_CHANNEL;

    if (!ident || !secret || !channel) {
      this.logger.warn('Xirsys env incomplete; falling back to Google STUN');
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }

    const auth = Buffer.from(`${ident}:${secret}`).toString('base64');
    const url = `${path}/_turn/${encodeURIComponent(channel)}`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'urls' }),
      });

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Xirsys ICE fetch failed (${res.status}): ${text}`);
        throw new ServiceUnavailableException('Unable to fetch ICE servers');
      }

      const json = (await res.json()) as {
        v?: { iceServers?: IceServer | IceServer[] };
        iceServers?: IceServer | IceServer[];
      };

      const raw = json.v?.iceServers ?? json.iceServers;
      const servers = Array.isArray(raw) ? raw : raw ? [raw] : [];

      if (servers.length === 0) {
        this.logger.error('Xirsys returned empty iceServers');
        throw new ServiceUnavailableException('Unable to fetch ICE servers');
      }

      return servers;
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(
        `Xirsys ICE fetch error: ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException('Unable to fetch ICE servers');
    }
  }
}
