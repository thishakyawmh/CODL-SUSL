<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #F8FAFC;
            color: #334155;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }
        .wrapper {
            width: 100%;
            background-color: #F8FAFC;
            padding: 40px 0;
        }
        .container {
            max-width: 570px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .header {
            background-color: #7C3AED;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #FFFFFF;
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
        }
        .content h2 {
            font-size: 18px;
            font-weight: 600;
            color: #1E293B;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .content p {
            font-size: 15px;
            color: #475569;
            margin-top: 0;
            margin-bottom: 24px;
        }
        .btn-container {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            background-color: #7C3AED;
            color: #FFFFFF !important;
            text-decoration: none;
            padding: 12px 30px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2), 0 2px 4px -1px rgba(124, 58, 237, 0.1);
            transition: background-color 0.2s ease;
        }
        .btn:hover {
            background-color: #6D28D9;
        }
        .footer {
            padding: 20px 30px;
            background-color: #F8FAFC;
            border-top: 1px solid #F1F5F9;
            text-align: center;
        }
        .footer p {
            font-size: 12px;
            color: #94A3B8;
            margin: 0 0 8px 0;
        }
        .footer p:last-child {
            margin: 0;
        }
        .note {
            font-size: 13px;
            color: #94A3B8;
            border-top: 1px solid #F1F5F9;
            padding-top: 20px;
            margin-top: 30px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>CODL PORTAL</h1>
            </div>
            <div class="content">
                <h2>Hello {{ $user->full_name }},</h2>
                <p>You are receiving this email because we received a password reset request for your account on the CODL Student Portal.</p>
                
                <div class="btn-container">
                    <a href="{{ $resetUrl }}" class="btn" target="_blank">Reset Password</a>
                </div>
                
                <p>This password reset link will expire in <strong>60 minutes</strong>.</p>
                <p>If you did not request a password reset, no further action is required and you can safely ignore this email.</p>
                
                <div class="note">
                    <p>If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:</p>
                    <p><a href="{{ $resetUrl }}" style="color: #7C3AED; text-decoration: underline;">{{ $resetUrl }}</a></p>
                </div>
            </div>
            <div class="footer">
                <p>Centre for Open & Distance Learning (CODL)</p>
                <p>Sabaragamuwa University of Sri Lanka</p>
                <p>&copy; {{ date('Y') }} CODL. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
