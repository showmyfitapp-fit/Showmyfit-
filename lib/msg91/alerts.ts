import { toMsg91Identifier } from '@/lib/auth/phone';

type Msg91Response = {
  type?: string;
  message?: string;
  [key: string]: unknown;
};

function authKey() {
  const key = process.env.MSG91_AUTH_KEY;
  if (!key) throw new Error('Missing MSG91_AUTH_KEY');
  return key;
}

async function msg91Post(url: string, body: Record<string, unknown>): Promise<Msg91Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authkey: authKey(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const raw = (await response.json().catch(() => ({}))) as Msg91Response;
  if (!response.ok) {
    throw new Error(
      typeof raw.message === 'string' ? raw.message : `MSG91 request failed (${response.status})`
    );
  }
  return raw;
}

export async function sendMsg91Sms(phone: string, message: string): Promise<void> {
  const mobile = toMsg91Identifier(phone);
  if (!mobile) return;

  const flowId = process.env.MSG91_SMS_FLOW_ID || process.env.MSG91_SMS_TEMPLATE_ID;
  const sender = process.env.MSG91_SMS_SENDER || 'SHOWMF';

  if (flowId) {
    await msg91Post('https://api.msg91.com/api/v5/flow/', {
      flow_id: flowId,
      sender,
      recipients: [
        {
          mobiles: mobile,
          VAR1: message,
          order: message,
          link: message,
        },
      ],
    });
    return;
  }

  const params = new URLSearchParams({
    authkey: authKey(),
    mobiles: mobile,
    message,
    sender,
    route: '4',
    country: '91',
  });
  const response = await fetch(`https://control.msg91.com/api/sendhttp.php?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`MSG91 SMS failed (${response.status})`);
  }
}

export async function sendMsg91WhatsApp(phone: string, message: string, vars?: {
  orderNumber?: string;
  link?: string;
}): Promise<void> {
  const mobile = toMsg91Identifier(phone);
  const integrated = process.env.MSG91_WHATSAPP_NUMBER;
  if (!mobile || !integrated) return;

  const template = process.env.MSG91_WHATSAPP_TEMPLATE;
  const language = process.env.MSG91_WHATSAPP_LANGUAGE || 'en';
  const namespace = process.env.MSG91_WHATSAPP_NAMESPACE;

  if (template) {
    await msg91Post('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
      integrated_number: integrated,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        type: 'template',
        template: {
          name: template,
          language: { code: language, policy: 'deterministic' },
          ...(namespace ? { namespace } : {}),
          to_and_components: [
            {
              to: [mobile],
              components: {
                body_1: { type: 'text', value: vars?.orderNumber || message },
                body_2: { type: 'text', value: vars?.link || message },
                body_3: { type: 'text', value: message },
              },
            },
          ],
        },
      },
    });
    return;
  }

  await msg91Post('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
    integrated_number: integrated,
    content_type: 'text',
    payload: {
      messaging_product: 'whatsapp',
      type: 'text',
      text: { body: message },
      to_and_components: [{ to: [mobile] }],
    },
  });
}

export async function sendMsg91OrderAlert(params: {
  phone?: string | null;
  message: string;
  orderNumber?: string;
  link?: string;
}): Promise<void> {
  if (!params.phone) return;
  const tasks: Promise<void>[] = [sendMsg91Sms(params.phone, params.message)];
  if (process.env.MSG91_WHATSAPP_NUMBER) {
    tasks.push(
      sendMsg91WhatsApp(params.phone, params.message, {
        orderNumber: params.orderNumber,
        link: params.link,
      })
    );
  }
  const results = await Promise.allSettled(tasks);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed && failed.status === 'rejected') {
    console.warn('MSG91 order alert failed:', failed.reason);
  }
}
