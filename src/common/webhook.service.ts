import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  // POST to customer's webhook_url when invoice event happens
  async sendWebhook(webhookUrl: string, payload: any): Promise<void> {
    if (!webhookUrl) return;

    try {
      const data = JSON.stringify({
        event: 'invoice.generated',
        timestamp: new Date().toISOString(),
        data: payload,
      });

      this.logger.log(`Sending webhook to ${webhookUrl}`);

      await this.postRequest(webhookUrl, data);

      this.logger.log(`Webhook sent successfully to ${webhookUrl}`);
    } catch (error) {
      this.logger.error(
        `Webhook failed for ${webhookUrl}: ${error.message}`,
      );
    }
  }

  private postRequest(url: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        this.logger.log(`Webhook response status: ${res.statusCode}`);
        resolve();
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }
}