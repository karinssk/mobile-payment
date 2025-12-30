const line = require('@line/bot-sdk');

// LINE configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// LINE client for sending messages
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

/**
 * Send push message to specific user (1:1 message)
 * @param {string} userId - LINE User ID
 * @param {object|array} messages - Message object(s) to send
 */
const sendPushMessage = async (userId, messages) => {
  try {
    const messageArray = Array.isArray(messages) ? messages : [messages];
    await client.pushMessage({
      to: userId,
      messages: messageArray,
    });
    return { success: true };
  } catch (error) {
    console.error('LINE send message error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create payment reminder Flex Message
 * @param {object} data - Payment data
 */
const createPaymentReminderFlex = (data) => {
  const { customerName, productName, amount, dueDate, monthNumber, totalMonths, reminderType } = data;
  
  let headerColor = '#1DB446'; // Green for normal
  let headerText = '🔔 แจ้งเตือนการชำระ';
  
  if (reminderType === 'on_due') {
    headerColor = '#FF8C00'; // Orange for due today
    headerText = '⚠️ ครบกำหนดชำระวันนี้';
  } else if (reminderType === 'overdue') {
    headerColor = '#FF0000'; // Red for overdue
    headerText = '🚨 เลยกำหนดชำระ';
  }

  return {
    type: 'flex',
    altText: `แจ้งเตือนการชำระ - ${productName}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: headerText,
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
          },
        ],
        backgroundColor: headerColor,
        paddingAll: '15px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `สวัสดีคุณ ${customerName}`,
            size: 'md',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'สินค้า', size: 'sm', color: '#555555', flex: 2 },
                  { type: 'text', text: productName, size: 'sm', color: '#111111', flex: 4, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: 'งวดที่', size: 'sm', color: '#555555', flex: 2 },
                  { type: 'text', text: `${monthNumber}/${totalMonths}`, size: 'sm', color: '#111111', flex: 4 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: 'ยอดชำระ', size: 'sm', color: '#555555', flex: 2 },
                  { type: 'text', text: `฿${Number(amount).toLocaleString()}`, size: 'lg', color: headerColor, weight: 'bold', flex: 4 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'sm',
                contents: [
                  { type: 'text', text: 'ครบกำหนด', size: 'sm', color: '#555555', flex: 2 },
                  { type: 'text', text: dueDate, size: 'sm', color: '#111111', flex: 4 },
                ],
              },
            ],
          },
        ],
        paddingAll: '20px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'กรุณาชำระเงินภายในวันที่กำหนด',
            size: 'xs',
            color: '#888888',
            align: 'center',
          },
        ],
        paddingAll: '10px',
      },
    },
  };
};

/**
 * Create QR Code payment message
 */
const createQRCodeMessage = (data) => {
  const { productName, amount, qrCodeUrl } = data;
  
  return {
    type: 'flex',
    altText: `QR Code ชำระเงิน - ฿${Number(amount).toLocaleString()}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💳 สแกนเพื่อชำระเงิน',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF',
          },
        ],
        backgroundColor: '#1DB446',
        paddingAll: '15px',
      },
      hero: {
        type: 'image',
        url: qrCodeUrl,
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'fit',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: productName,
            weight: 'bold',
            size: 'md',
            align: 'center',
          },
          {
            type: 'text',
            text: `฿${Number(amount).toLocaleString()}`,
            size: 'xl',
            color: '#1DB446',
            weight: 'bold',
            align: 'center',
            margin: 'md',
          },
        ],
        paddingAll: '20px',
      },
    },
  };
};

module.exports = {
  config,
  client,
  sendPushMessage,
  createPaymentReminderFlex,
  createQRCodeMessage,
};
