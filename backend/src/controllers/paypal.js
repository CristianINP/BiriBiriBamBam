const { paypalConfig } = require('../config/paypal');

function getBasicAuth() {
  return Buffer
    .from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`)
    .toString('base64');
}

async function getAccessToken() {
  const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${getBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error obteniendo access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function createOrder(req, res) {
  try {
    const accessToken = await getAccessToken();
    const orderData = req.body;

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'MXN',
            value: Number(orderData.total).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'MXN',
                value: Number(orderData.total).toFixed(2)
              }
            }
          },
          items: orderData.items.map(item => ({
            name: item.nombre,
            quantity: String(item.cantidad),
            unit_amount: {
              currency_code: 'MXN',
              value: Number(item.precio).toFixed(2)
            }
          }))
        }
      ]
    };

    const response = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function captureOrder(req, res) {
  try {
    const { orderID } = req.params;
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${paypalConfig.baseUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createOrder, captureOrder };
