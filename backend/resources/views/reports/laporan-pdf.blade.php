<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { color: #e74c3c; text-align: center; }
        .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #e74c3c; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .total-row { font-weight: bold; background: #f0f0f0; }
        .footer { margin-top: 20px; text-align: right; color: #666; }
    </style>
</head>
<body>
    <h1>Picollo — Laporan Keuangan</h1>
    <p class="subtitle">
        Periode: {{ $start_date }} s/d {{ $end_date }}<br>
        Digenerate oleh: {{ $user->name }} | {{ now()->format('d/m/Y H:i') }}
    </p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Kode Transaksi</th>
                <th>Outlet</th>
                <th>Kasir</th>
                <th>Metode</th>
                <th>Total</th>
                <th>Tanggal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transaksi as $i => $t)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $t->transaction_code }}</td>
                <td>{{ $t->outlet?->nama }}</td>
                <td>{{ $t->kasir?->name }}</td>
                <td>{{ strtoupper($t->metode_pembayaran) }}</td>
                <td>Rp {{ number_format($t->total_amount, 0, ',', '.') }}</td>
                <td>{{ $t->created_at->format('d/m/Y H:i') }}</td>
            </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="5">TOTAL</td>
                <td>Rp {{ number_format($total, 0, ',', '.') }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <p class="footer">Picollo — Blockchain-powered Sales Audit System</p>
</body>
</html>