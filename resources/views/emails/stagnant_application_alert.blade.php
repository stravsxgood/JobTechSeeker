<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pemberitahuan Status Lamaran</title>
    <style>
        body {
            background-color: #0a0a0a;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #141414;
            border: 1px solid #313131;
            border-radius: 8px;
            padding: 32px;
        }
        .header {
            margin-bottom: 24px;
            border-bottom: 1px solid #313131;
            padding-bottom: 16px;
        }
        .badge {
            display: inline-block;
            background-color: #1e1e1e;
            border: 1px solid #313131;
            color: #6798ff;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 12px;
        }
        h1 {
            font-size: 20px;
            margin: 0 0 8px 0;
            color: #ffffff;
        }
        .subtext {
            color: #a7a7a7;
            font-size: 14px;
            margin: 0;
        }
        .section-box {
            background-color: #1e1e1e;
            border: 1px solid #313131;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }
        .section-title {
            color: #6798ff;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 8px 0;
        }
        p {
            color: #d1d5db;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 12px 0;
        }
        .rec-card {
            background-color: #141414;
            border: 1px solid #313131;
            border-radius: 6px;
            padding: 14px;
            margin-bottom: 12px;
        }
        .rec-title {
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 6px 0;
        }
        .rec-meta {
            color: #a7a7a7;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 6px;
        }
        .tag {
            display: inline-block;
            background-color: #1e1e1e;
            border: 1px solid #454545;
            color: #a7a7a7;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 4px;
            margin-top: 4px;
        }
        .footer {
            margin-top: 32px;
            border-top: 1px solid #313131;
            padding-top: 16px;
            text-align: center;
            color: #7c7c7c;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">CAREERPILOT AI MONITORING</span>
            <h1>Tidak Ada Perkembangan Lamaran (2+ Minggu)</h1>
            <p class="subtext">Posisi <strong>{{ $application->job_title }}</strong> di <strong>{{ $application->company?->name }}</strong></p>
        </div>

        <div class="section-box">
            <div class="section-title">ANALISIS STATUS</div>
            <p>{{ $aiAdvice['analysis'] }}</p>
        </div>

        <div class="section-box">
            <div class="section-title">SARAN DARI CAREER ADVISOR</div>
            <p>{{ $aiAdvice['advice'] }}</p>
        </div>

        <div>
            <div class="section-title" style="margin-bottom: 12px;">REKOMENDASI LOWONGAN SERUPA UNTUK DILAMAR</div>
            @foreach ($aiAdvice['recommendations'] as $rec)
                <div class="rec-card">
                    <div class="rec-title">{{ $rec['job_title'] }}</div>
                    <div class="rec-meta">{{ $rec['reason'] }}</div>
                    <div style="margin-top: 8px;">
                        <span style="font-size: 12px; color: #7c7c7c;">Skill Kunci:</span>
                        @foreach ($rec['key_skills'] as $skill)
                            <span class="tag">{{ $skill }}</span>
                        @endforeach
                    </div>
                    <div style="margin-top: 6px;">
                        <span style="font-size: 12px; color: #7c7c7c;">Cari di:</span>
                        @foreach ($rec['suggested_portals'] as $portal)
                            <span class="tag" style="color: #6798ff; border-color: #6798ff;">{{ $portal }}</span>
                        @endforeach
                    </div>
                </div>
            @endforeach
        </div>

        <div class="footer">
            <p style="margin: 0;">Email ini dikirim otomatis oleh CareerPilot AI untuk membantu efektivitas pencarian kerja Anda.</p>
        </div>
    </div>
</body>
</html>
