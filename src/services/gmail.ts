import { GmailEmailMessage } from '../types/meeting';

// Helper to decode Base64URL string (standard in Gmail API)
function decodeBase64Url(input: string): string {
  try {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  } catch (e) {
    try {
      return atob(input.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return input;
    }
  }
}

// Helper to extract body from Gmail message parts
function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer text/plain or text/html
    const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
    if (textPart && textPart.body && textPart.body.data) {
      return decodeBase64Url(textPart.body.data);
    }
    const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      // Strip html tags or return raw html text
      const rawHtml = decodeBase64Url(htmlPart.body.data);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;
      return tempDiv.textContent || tempDiv.innerText || rawHtml;
    }
    // Recursive search for multipart/alternative
    for (const part of payload.parts) {
      const nested = extractBodyFromPayload(part);
      if (nested) return nested;
    }
  }
  return '';
}

// Search meeting emails from Gmail
export async function searchMeetingEmails(
  accessToken: string,
  query: string = 'subject:meeting OR subject:sync OR meeting',
  maxResults: number = 10
): Promise<GmailEmailMessage[]> {
  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!listRes.ok) {
      const errData = await listRes.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gmail API Error: ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // Fetch full message details in parallel
    const messages = await Promise.all(
      listData.messages.map(async (item: { id: string; threadId: string }) => {
        try {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`;
          const detailRes = await fetch(detailUrl, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!detailRes.ok) return null;
          const detail = await detailRes.json();

          const headers: Array<{ name: string; value: string }> = detail.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          const subject = getHeader('Subject') || '(No Subject)';
          const from = getHeader('From') || 'Unknown Sender';
          const to = getHeader('To') || '';
          const date = getHeader('Date') || '';
          const snippet = detail.snippet || '';
          const body = extractBodyFromPayload(detail.payload) || snippet;

          return {
            id: detail.id,
            threadId: detail.threadId,
            from,
            to,
            subject,
            date,
            snippet,
            body
          } as GmailEmailMessage;
        } catch {
          return null;
        }
      })
    );

    return messages.filter((m): m is GmailEmailMessage => m !== null);
  } catch (error: any) {
    console.error('Failed to search meeting emails:', error);
    throw error;
  }
}

// Helper to encode string to Base64URL
function encodeBase64Url(str: string): string {
  // UTF-8 safe base64 encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Send meeting summary email using Gmail API
export async function sendMeetingSummaryEmail(
  accessToken: string,
  params: {
    to: string;
    cc?: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
  }
): Promise<{ id: string; threadId: string }> {
  try {
    const boundary = `----=_Part_${Date.now()}`;
    const cleanTo = params.to.trim();
    const cleanCc = params.cc ? params.cc.trim() : '';

    let emailHeaders = [
      `To: ${cleanTo}`,
      cleanCc ? `Cc: ${cleanCc}` : '',
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ''
    ]
      .filter(Boolean)
      .join('\r\n');

    const emailBody = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.bodyText,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      params.bodyHtml,
      '',
      `--${boundary}--`
    ].join('\r\n');

    const rawMessage = `${emailHeaders}\r\n${emailBody}`;
    const encodedRaw = encodeBase64Url(rawMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedRaw })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to send email (${res.status} ${res.statusText})`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error sending meeting email via Gmail:', error);
    throw error;
  }
}
