import nodemailer from 'nodemailer';
import { db } from '../../../database/db.js';

/**
 * AROHVI Automatic Order Confirmation Email Service
 * Supports Resend API and standard SMTP with safe fallback
 */

const formatOrderEmailHtml = (order) => {
  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #39312D; color: #F0E6DB; font-size: 14px;">
        <strong>${item.name}</strong>
        ${item.variant ? `<br><span style="font-size: 12px; color: #C7A58A;">${item.variant}</span>` : ''}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #39312D; color: #D4C7BA; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #39312D; color: #C7A58A; font-size: 14px; text-align: right; font-weight: 600;">
        ₹${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AROHVI Order Confirmation #${order.order_number}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #121110; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F0E6DB;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #121110; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1D1A18; border: 1px solid #39312D; border-top: 3px solid #8C2635; border-radius: 4px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 25px 20px; text-align: center; background-color: #181615; border-bottom: 1px solid #39312D;">
                  <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; letter-spacing: 0.18em; color: #F0E6DB; text-transform: uppercase;">AROHVI</h1>
                  <p style="margin: 6px 0 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #C7A58A;">Adorn the Unordinary</p>
                </td>
              </tr>

              <!-- Greeting & Order Status -->
              <tr>
                <td style="padding: 30px 25px 15px;">
                  <span style="display: inline-block; padding: 4px 10px; background-color: rgba(74, 222, 128, 0.15); border: 1px solid #4ade80; color: #4ade80; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 2px;">
                    Order Confirmed & Payment Verified
                  </span>
                  <h2 style="margin: 16px 0 8px; font-family: Georgia, serif; font-size: 22px; color: #F0E6DB;">
                    Thank you for adorning the unordinary, ${order.customer_name}.
                  </h2>
                  <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #D4C7BA;">
                    We have received your order <strong>#${order.order_number}</strong>. Our Bangalore studio is carefully preparing your pieces for express pan-India dispatch.
                  </p>
                </td>
              </tr>

              <!-- Items Breakdown -->
              <tr>
                <td style="padding: 0 25px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 1px solid #5A4E48;">
                        <th style="padding: 8px; text-align: left; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #C7A58A;">Adornment</th>
                        <th style="padding: 8px; text-align: center; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #C7A58A;">Qty</th>
                        <th style="padding: 8px; text-align: right; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #C7A58A;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Totals -->
              <tr>
                <td style="padding: 0 25px 25px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #181615; padding: 15px; border-radius: 4px; border: 1px solid #39312D;">
                    <tr>
                      <td style="font-size: 13px; color: #D4C7BA; padding: 4px 0;">Subtotal:</td>
                      <td style="font-size: 13px; color: #F0E6DB; text-align: right; padding: 4px 0;">₹${Number(order.subtotal).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #D4C7BA; padding: 4px 0;">Standard Shipping:</td>
                      <td style="font-size: 13px; color: #4ade80; text-align: right; padding: 4px 0;">
                        ${order.shipping_fee > 0 ? `₹${order.shipping_fee}` : 'FREE (Special Studio Drop)'}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 16px; font-weight: 700; color: #F0E6DB; padding-top: 10px; border-top: 1px solid #39312D;">Total Paid:</td>
                      <td style="font-size: 18px; font-weight: 700; color: #C7A58A; text-align: right; padding-top: 10px; border-top: 1px solid #39312D;">₹${Number(order.total_amount).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 11px; color: #7A6F68; padding-top: 6px;">Payment Method:</td>
                      <td style="font-size: 11px; color: #D4C7BA; text-align: right; padding-top: 6px;">${order.payment_method}</td>
                    </tr>
                    ${order.razorpay_payment_id ? `
                    <tr>
                      <td style="font-size: 11px; color: #7A6F68; padding-top: 2px;">Razorpay Ref:</td>
                      <td style="font-size: 11px; color: #C7A58A; text-align: right; padding-top: 2px;">${order.razorpay_payment_id}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>

              <!-- Shipping Destination -->
              <tr>
                <td style="padding: 0 25px 30px;">
                  <h3 style="margin: 0 0 10px; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #C7A58A;">Shipping Address</h3>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #D4C7BA;">
                    <strong>${order.customer_name}</strong><br>
                    ${order.shipping_address}<br>
                    ${order.city}, ${order.state} - ${order.pincode}<br>
                    Phone: ${order.customer_phone}
                  </p>
                  ${order.delivery_instructions ? `
                    <p style="margin: 8px 0 0; font-size: 12px; color: #C7A58A;">
                      <em>Delivery Note: ${order.delivery_instructions}</em>
                    </p>
                  ` : ''}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 25px; background-color: #121110; border-top: 1px solid #39312D; text-align: center; font-size: 12px; color: #7A6F68;">
                  <p style="margin: 0 0 6px;">Care tip: Store in your signature cloth pouch. Keep away from water and direct perfume.</p>
                  <p style="margin: 0;">Need help? Email us anytime at <a href="mailto:care@arohvi.in" style="color: #C7A58A; text-decoration: none;">care@arohvi.in</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send order confirmation email
 * Idempotent: checks order.email_sent to prevent duplicates
 */
export const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.customer_email) {
    console.warn('[EmailService] Skipped: order or customer email missing.');
    return { success: false, reason: 'missing_email' };
  }

  // Idempotency check: avoid duplicate email dispatches
  if (order.email_sent === true) {
    console.log(`[EmailService] Notice: confirmation email for #${order.order_number} already sent on ${order.email_sent_at}. Skipping duplicate.`);
    return { success: true, duplicate: true };
  }

  const subject = `Order Confirmed: #${order.order_number} — AROHVI Adorn the Unordinary`;
  const htmlContent = formatOrderEmailHtml(order);
  const fromEmail = process.env.EMAIL_FROM || 'AROHVI Adornments <orders@arohvi.in>';

  try {
    // 1. Resend API integration if configured
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [order.customer_email],
          subject,
          html: htmlContent
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Resend API error');
      }

      db.markEmailSent(order.id);
      console.log(`[EmailService] ✓ Order confirmation sent via Resend API to ${order.customer_email} (ID: ${data.id})`);
      return { success: true, provider: 'resend', id: data.id };
    }

    // 2. SMTP integration if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: fromEmail,
        to: order.customer_email,
        subject,
        html: htmlContent
      });

      db.markEmailSent(order.id);
      console.log(`[EmailService] ✓ Order confirmation sent via SMTP to ${order.customer_email} (MsgID: ${info.messageId})`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    }

    // 3. Graceful Local / Development Logger Fallback
    // Logs full dispatch details without crashing or failing the order
    db.markEmailSent(order.id);
    console.log(`=======================================================`);
    console.log(`📨 [EmailService] SIMULATED DISPATCH (No SMTP/Resend key configured)`);
    console.log(`To: ${order.customer_email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Order: #${order.order_number} | Total: ₹${order.total_amount} | Status: ${order.payment_status}`);
    console.log(`Items (${order.items?.length || 0}): ${(order.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ')}`);
    console.log(`Shipping To: ${order.customer_name}, ${order.city}, ${order.pincode}`);
    console.log(`=======================================================`);

    return { 
      success: true, 
      provider: 'simulated_logger',
      note: 'Configured for production with RESEND_API_KEY or SMTP_HOST in .env'
    };
  } catch (error) {
    console.error(`[EmailService] Error dispatching email to ${order.customer_email}:`, error.message);
    // Do not fail order if email provider throws; log error
    return { success: false, error: error.message };
  }
};
