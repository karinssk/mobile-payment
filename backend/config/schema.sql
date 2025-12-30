-- Mobile Installment Database Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS mobile_installment;
USE mobile_installment;

-- Customers table (ลูกค้า)
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT 'ชื่อลูกค้า',
  phone VARCHAR(20) NOT NULL COMMENT 'เบอร์โทรศัพท์',
  line_user_id VARCHAR(255) UNIQUE COMMENT 'LINE User ID from webhook',
  status ENUM('normal', 'paid', 'overdue') DEFAULT 'normal' COMMENT 'สถานะลูกค้า: ปกติ/ชำระแล้ว/ค้างชำระ',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Installments table (รายการผ่อนชำระ)
CREATE TABLE IF NOT EXISTS installments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL COMMENT 'ชื่อสินค้า เช่น iPhone 15',
  total_amount DECIMAL(10,2) NOT NULL COMMENT 'ราคารวม',
  monthly_payment DECIMAL(10,2) NOT NULL COMMENT 'ยอดผ่อนต่อเดือน',
  total_months INT NOT NULL COMMENT 'จำนวนงวด',
  start_date DATE NOT NULL COMMENT 'วันเริ่มต้นผ่อน',
  due_day INT NOT NULL DEFAULT 1 COMMENT 'วันครบกำหนดชำระในแต่ละเดือน',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Payments table (รายการชำระ)
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  installment_id INT NOT NULL,
  month_number INT NOT NULL COMMENT 'งวดที่',
  due_date DATE NOT NULL COMMENT 'วันครบกำหนดชำระ',
  amount DECIMAL(10,2) NOT NULL COMMENT 'จำนวนเงิน',
  status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending' COMMENT 'สถานะ: รอชำระ/ชำระแล้ว/เลยกำหนด',
  paid_at TIMESTAMP NULL COMMENT 'วันที่ชำระ',
  omise_charge_id VARCHAR(255) NULL COMMENT 'Omise charge ID',
  qr_code_data TEXT NULL COMMENT 'QR Code data',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE
);

-- Notification logs (ประวัติการแจ้งเตือน)
CREATE TABLE IF NOT EXISTS notification_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payment_id INT NOT NULL,
  customer_id INT NOT NULL,
  notification_type ENUM('before_due', 'on_due', 'overdue') NOT NULL COMMENT 'ประเภทการแจ้งเตือน',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('success', 'failed') NOT NULL,
  error_message TEXT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_customers_line_user_id ON customers(line_user_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notification_logs_payment_id ON notification_logs(payment_id);
