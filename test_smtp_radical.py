import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_smtp():
    host = "smtp.gmail.com"
    port = 465
    user = "emna.awini.work@gmail.com"
    password = "pssmaxzxgfeyfqlf"
    
    print(f"Connecting to {host}:{port} as {user}...")
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = user
        msg['To'] = user
        msg['Subject'] = "SMTP RADICAL TEST ✅"
        body = "If you see this, the NEW App Password 'Mobility_Pro_Final' is WORKING! No more 535 errors."
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect
        server = smtplib.SMTP_SSL(host, port)
        server.set_debuglevel(1)  # SEE EVERYTHING
        
        print("Attempting login...")
        server.login(user, password)
        
        print("Login successful! Sending test email...")
        server.send_message(msg)
        server.quit()
        
        print("\n✅ SUCCESS: Email sent successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ FAILURE: {str(e)}")
        return False

if __name__ == "__main__":
    test_smtp()
