<?php

/**
 * SIMKlinik — Bridge Handlers
 * ----------------------------
 * Semua handler query diorganisir per modul.
 * Format action: "modul.method" — contoh: "pasien.index", "invoice.store"
 *
 * ATURAN KEAMANAN:
 * - Tidak ada raw SQL yang diterima dari luar
 * - Semua query menggunakan prepared statements + parameter binding
 * - Validasi input dilakukan di setiap handler sebelum query
 */

declare(strict_types=1);

// ─── Custom Exception ─────────────────────────────────────────────────────────

class BridgeException extends RuntimeException
{
    public function __construct(string $message, int $code = 422)
    {
        parent::__construct($message, $code);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $f) {
        if (!isset($data[$f]) || $data[$f] === '') {
            throw new BridgeException("Missing required field: {$f}", 422);
        }
    }
}

function paginate(PDO $pdo, string $sql, array $params, int $page, int $per_page = 15): array
{
    $offset = ($page - 1) * $per_page;

    // Total count
    $count_sql = "SELECT COUNT(*) as total FROM ({$sql}) as sub";
    $stmt = $pdo->prepare($count_sql);
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();

    // Data
    $stmt = $pdo->prepare("{$sql} LIMIT {$per_page} OFFSET {$offset}");
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    return [
        'data'         => $items,
        'total'        => $total,
        'per_page'     => $per_page,
        'current_page' => $page,
        'last_page'    => (int) ceil($total / $per_page),
    ];
}

function generate_no_rekam_medis(PDO $pdo): string
{
    $stmt = $pdo->query("SELECT COUNT(*) FROM pasien");
    $count = (int) $stmt->fetchColumn();
    return 'RM' . str_pad((string)($count + 1), 6, '0', STR_PAD_LEFT);
}

function generate_no_antrian(PDO $pdo, string $tanggal): int
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM pendaftaran WHERE tanggal = ? AND status != 'batal'"
    );
    $stmt->execute([$tanggal]);
    return (int) $stmt->fetchColumn() + 1;
}

function generate_no_invoice(PDO $pdo): string
{
    $prefix = 'INV' . date('Ymd');
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM invoice WHERE no_invoice LIKE ?");
    $stmt->execute([$prefix . '%']);
    $count = (int) $stmt->fetchColumn();
    return $prefix . str_pad((string)($count + 1), 4, '0', STR_PAD_LEFT);
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function dispatch(PDO $pdo, string $action, array $data): mixed
{
    return match ($action) {

        // ── Auth ──────────────────────────────────────────────────────────────
        'auth.findByUsername'        => auth_findByUsername($pdo, $data),

        // ── Pengguna ──────────────────────────────────────────────────────────
        'pengguna.index'             => pengguna_index($pdo, $data),
        'pengguna.store'             => pengguna_store($pdo, $data),
        'pengguna.update'            => pengguna_update($pdo, $data),
        'pengguna.toggleAktif'       => pengguna_toggleAktif($pdo, $data),

        // ── Dokter ────────────────────────────────────────────────────────────
        'dokter.index'               => dokter_index($pdo, $data),
        'dokter.store'               => dokter_store($pdo, $data),
        'dokter.update'              => dokter_update($pdo, $data),
        'dokter.toggleAktif'         => dokter_toggleAktif($pdo, $data),

        // ── Spesialisasi ──────────────────────────────────────────────────────
        'spesialisasi.index'         => spesialisasi_index($pdo, $data),
        'spesialisasi.store'         => spesialisasi_store($pdo, $data),
        'spesialisasi.update'        => spesialisasi_update($pdo, $data),

        // ── Layanan ───────────────────────────────────────────────────────────
        'layanan.index'              => layanan_index($pdo, $data),
        'layanan.store'              => layanan_store($pdo, $data),
        'layanan.update'             => layanan_update($pdo, $data),

        // ── Produk ────────────────────────────────────────────────────────────
        'produk.index'               => produk_index($pdo, $data),
        'produk.store'               => produk_store($pdo, $data),
        'produk.update'              => produk_update($pdo, $data),
        'produk.deductStok'          => produk_deductStok($pdo, $data),

        // ── Jadwal Dokter ─────────────────────────────────────────────────────
        'jadwal.index'               => jadwal_index($pdo, $data),
        'jadwal.store'               => jadwal_store($pdo, $data),
        'jadwal.update'              => jadwal_update($pdo, $data),

        // ── Diagnosa ──────────────────────────────────────────────────────────
        'diagnosa.search'            => diagnosa_search($pdo, $data),

        // ── Pengaturan ────────────────────────────────────────────────────────
        'pengaturan.get'             => pengaturan_get($pdo),
        'pengaturan.update'          => pengaturan_update($pdo, $data),

        // ── Pasien ────────────────────────────────────────────────────────────
        'pasien.index'               => pasien_index($pdo, $data),
        'pasien.search'              => pasien_search($pdo, $data),
        'pasien.show'                => pasien_show($pdo, $data),
        'pasien.store'               => pasien_store($pdo, $data),
        'pasien.update'              => pasien_update($pdo, $data),
        'pasien.riwayat'             => pasien_riwayat($pdo, $data),

        // ── Pendaftaran ───────────────────────────────────────────────────────
        'pendaftaran.index'          => pendaftaran_index($pdo, $data),
        'pendaftaran.show'           => pendaftaran_show($pdo, $data),
        'pendaftaran.store'          => pendaftaran_store($pdo, $data),
        'pendaftaran.batal'          => pendaftaran_batal($pdo, $data),
        'pendaftaran.updateStatus'   => pendaftaran_updateStatus($pdo, $data),
        'antrian.hari_ini'           => antrian_hari_ini($pdo, $data),

        // ── RME ───────────────────────────────────────────────────────────────
        'rme.show'                   => rme_show($pdo, $data),
        'rme.store'                  => rme_store($pdo, $data),
        'rme.update'                 => rme_update($pdo, $data),
        'rme.finalisasi'             => rme_finalisasi($pdo, $data),
        'rme.index'                  => rme_index($pdo, $data),
        'tindakan.store'             => tindakan_store($pdo, $data),
        'tindakan.delete'            => tindakan_delete($pdo, $data),
        'resep.storeItem'            => resep_storeItem($pdo, $data),
        'resep.deleteItem'           => resep_deleteItem($pdo, $data),

        // ── Invoice ───────────────────────────────────────────────────────────
        'invoice.index'              => invoice_index($pdo, $data),
        'invoice.show'               => invoice_show($pdo, $data),
        'invoice.generate'           => invoice_generate($pdo, $data),
        'invoice.applyDiskon'        => invoice_applyDiskon($pdo, $data),
        'invoice.batal'              => invoice_batal($pdo, $data),
        'pembayaran.store'           => pembayaran_store($pdo, $data),

        // ── Follow Up WA ──────────────────────────────────────────────────────
        'followup.index'             => followup_index($pdo, $data),
        'followup.store'             => followup_store($pdo, $data),
        'followup.tandaiTerkirim'    => followup_tandaiTerkirim($pdo, $data),

        // ── Laporan ───────────────────────────────────────────────────────────
        'laporan.harian'             => laporan_harian($pdo, $data),
        'laporan.bulanan'            => laporan_bulanan($pdo, $data),

        default => throw new BridgeException("Unknown action: {$action}", 404),
    };
}

// =============================================================================
// AUTH
// =============================================================================

function auth_findByUsername(PDO $pdo, array $data): array
{
    require_fields($data, ['username', 'password']);
    $stmt = $pdo->prepare(
        "SELECT id, nama_lengkap, username, password, role
         FROM pengguna
         WHERE username = ? AND password = ? AND is_aktif = 1
         LIMIT 1"
    );
    $stmt->execute([$data['username'], $data['password']]);
    $user = $stmt->fetch();
    if (!$user) throw new BridgeException('Username atau password salah', 401);
    unset($user['password']); // jangan return password ke client
    return $user;
}

// =============================================================================
// PENGGUNA
// =============================================================================

function pengguna_index(PDO $pdo, array $data): array
{
    $page = (int)($data['page'] ?? 1);
    $sql  = "SELECT id, nama_lengkap, username, role, is_aktif, created_at
             FROM pengguna
             WHERE role != 'superadmin'
             ORDER BY nama_lengkap ASC";
    return paginate($pdo, $sql, [], $page);
}

function pengguna_store(PDO $pdo, array $data): array
{
    require_fields($data, ['nama_lengkap', 'username', 'password', 'role']);
    if (!in_array($data['role'], ['admin', 'dokter', 'karyawan'])) {
        throw new BridgeException('Role tidak valid');
    }
    // Cek username unik
    $stmt = $pdo->prepare("SELECT id FROM pengguna WHERE username = ?");
    $stmt->execute([$data['username']]);
    if ($stmt->fetch()) throw new BridgeException('Username sudah digunakan');

    $stmt = $pdo->prepare(
        "INSERT INTO pengguna (nama_lengkap, username, password, role, is_aktif)
         VALUES (?, ?, ?, ?, 1)"
    );
    $stmt->execute([$data['nama_lengkap'], $data['username'], $data['password'], $data['role']]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function pengguna_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_lengkap', 'role']);
    $params = [$data['nama_lengkap'], $data['role']];
    $sql    = "UPDATE pengguna SET nama_lengkap=?, role=?";

    if (!empty($data['password'])) {
        $sql     .= ", password=?";
        $params[] = $data['password'];
    }
    $sql     .= " WHERE id=? AND role != 'superadmin'";
    $params[] = (int)$data['id'];

    $pdo->prepare($sql)->execute($params);
    return ['success' => true];
}

function pengguna_toggleAktif(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $pdo->prepare(
        "UPDATE pengguna SET is_aktif = NOT is_aktif WHERE id = ? AND role != 'superadmin'"
    )->execute([(int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// DOKTER
// =============================================================================

function dokter_index(PDO $pdo, array $data): array
{
    $hanya_aktif = $data['aktif'] ?? false;
    $sql = "SELECT d.id, d.no_sip, d.is_aktif,
                   p.nama_lengkap, p.id as id_pengguna,
                   s.nama_spesialisasi, s.id as id_spesialisasi
            FROM dokter d
            JOIN pengguna p ON p.id = d.id_pengguna
            JOIN spesialisasi s ON s.id = d.id_spesialisasi";
    if ($hanya_aktif) $sql .= " WHERE d.is_aktif = 1";
    $sql .= " ORDER BY p.nama_lengkap ASC";
    $stmt = $pdo->query($sql);
    return ['data' => $stmt->fetchAll()];
}

function dokter_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pengguna', 'id_spesialisasi', 'no_sip']);
    $stmt = $pdo->prepare(
        "INSERT INTO dokter (id_pengguna, id_spesialisasi, no_sip, is_aktif)
         VALUES (?, ?, ?, 1)"
    );
    $stmt->execute([$data['id_pengguna'], $data['id_spesialisasi'], $data['no_sip']]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function dokter_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_spesialisasi', 'no_sip']);
    $pdo->prepare(
        "UPDATE dokter SET id_spesialisasi=?, no_sip=? WHERE id=?"
    )->execute([$data['id_spesialisasi'], $data['no_sip'], (int)$data['id']]);
    return ['success' => true];
}

function dokter_toggleAktif(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $pdo->prepare("UPDATE dokter SET is_aktif = NOT is_aktif WHERE id=?")
        ->execute([(int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// SPESIALISASI
// =============================================================================

function spesialisasi_index(PDO $pdo, array $data): array
{
    $stmt = $pdo->query("SELECT * FROM spesialisasi ORDER BY nama_spesialisasi ASC");
    return ['data' => $stmt->fetchAll()];
}

function spesialisasi_store(PDO $pdo, array $data): array
{
    require_fields($data, ['nama_spesialisasi']);
    $pdo->prepare("INSERT INTO spesialisasi (nama_spesialisasi) VALUES (?)")
        ->execute([$data['nama_spesialisasi']]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function spesialisasi_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_spesialisasi']);
    $pdo->prepare("UPDATE spesialisasi SET nama_spesialisasi=? WHERE id=?")
        ->execute([$data['nama_spesialisasi'], (int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// LAYANAN
// =============================================================================

function layanan_index(PDO $pdo, array $data): array
{
    $page        = (int)($data['page'] ?? 1);
    $hanya_aktif = $data['aktif'] ?? false;
    $sql = "SELECT * FROM layanan";
    if ($hanya_aktif) $sql .= " WHERE is_aktif = 1";
    $sql .= " ORDER BY nama_layanan ASC";
    return paginate($pdo, $sql, [], $page);
}

function layanan_store(PDO $pdo, array $data): array
{
    require_fields($data, ['nama_layanan', 'kategori', 'harga']);
    $pdo->prepare(
        "INSERT INTO layanan (nama_layanan, kategori, harga, durasi_menit, is_aktif)
         VALUES (?, ?, ?, ?, 1)"
    )->execute([
        $data['nama_layanan'],
        $data['kategori'],
        $data['harga'],
        $data['durasi_menit'] ?? 30,
    ]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function layanan_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_layanan', 'kategori', 'harga']);
    if (isset($data['is_aktif'])) {
        $pdo->prepare(
            "UPDATE layanan SET nama_layanan=?, kategori=?, harga=?, durasi_menit=?, is_aktif=? WHERE id=?"
        )->execute([
            $data['nama_layanan'], $data['kategori'], $data['harga'],
            $data['durasi_menit'] ?? 30, (int)$data['is_aktif'], (int)$data['id'],
        ]);
    } else {
        $pdo->prepare(
            "UPDATE layanan SET nama_layanan=?, kategori=?, harga=?, durasi_menit=? WHERE id=?"
        )->execute([
            $data['nama_layanan'], $data['kategori'], $data['harga'],
            $data['durasi_menit'] ?? 30, (int)$data['id'],
        ]);
    }
    return ['success' => true];
}

// =============================================================================
// PRODUK
// =============================================================================

function produk_index(PDO $pdo, array $data): array
{
    $page        = (int)($data['page'] ?? 1);
    $hanya_aktif = $data['aktif'] ?? false;
    $sql = "SELECT * FROM produk";
    if ($hanya_aktif) $sql .= " WHERE is_aktif = 1";
    $sql .= " ORDER BY nama_produk ASC";
    return paginate($pdo, $sql, [], $page);
}

function produk_store(PDO $pdo, array $data): array
{
    require_fields($data, ['nama_produk', 'kategori', 'satuan', 'harga_jual']);
    $pdo->prepare(
        "INSERT INTO produk (nama_produk, kategori, satuan, harga_jual, stok, stok_minimum, is_aktif)
         VALUES (?, ?, ?, ?, ?, ?, 1)"
    )->execute([
        $data['nama_produk'], $data['kategori'], $data['satuan'], $data['harga_jual'],
        $data['stok'] ?? 0, $data['stok_minimum'] ?? 5,
    ]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function produk_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_produk', 'kategori', 'satuan', 'harga_jual']);
    $fields = "nama_produk=?, kategori=?, satuan=?, harga_jual=?, stok_minimum=?";
    $params = [
        $data['nama_produk'], $data['kategori'], $data['satuan'],
        $data['harga_jual'], $data['stok_minimum'] ?? 5,
    ];
    if (isset($data['stok'])) { $fields .= ", stok=?"; $params[] = $data['stok']; }
    if (isset($data['is_aktif'])) { $fields .= ", is_aktif=?"; $params[] = (int)$data['is_aktif']; }
    $params[] = (int)$data['id'];
    $pdo->prepare("UPDATE produk SET {$fields} WHERE id=?")->execute($params);
    return ['success' => true];
}

function produk_deductStok(PDO $pdo, array $data): array
{
    // $data['items'] = [['id_produk' => 1, 'qty' => 2], ...]
    require_fields($data, ['items']);
    $pdo->beginTransaction();
    try {
        foreach ($data['items'] as $item) {
            $pdo->prepare("UPDATE produk SET stok = stok - ? WHERE id = ? AND stok >= ?")
                ->execute([(int)$item['qty'], (int)$item['id_produk'], (int)$item['qty']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    return ['success' => true];
}

// =============================================================================
// JADWAL DOKTER
// =============================================================================

function jadwal_index(PDO $pdo, array $data): array
{
    $params = [];
    $sql    = "SELECT j.*, p.nama_lengkap as nama_dokter
               FROM jadwal_dokter j
               JOIN dokter d ON d.id = j.id_dokter
               JOIN pengguna p ON p.id = d.id_pengguna";
    if (!empty($data['id_dokter'])) {
        $sql     .= " WHERE j.id_dokter = ?";
        $params[] = (int)$data['id_dokter'];
    }
    $sql .= " ORDER BY FIELD(j.hari,'senin','selasa','rabu','kamis','jumat','sabtu'), j.jam_mulai";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return ['data' => $stmt->fetchAll()];
}

function jadwal_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_dokter', 'hari', 'jam_mulai', 'jam_selesai', 'kuota']);
    $pdo->prepare(
        "INSERT INTO jadwal_dokter (id_dokter, hari, jam_mulai, jam_selesai, kuota, is_aktif)
         VALUES (?, ?, ?, ?, ?, 1)"
    )->execute([
        $data['id_dokter'], $data['hari'], $data['jam_mulai'],
        $data['jam_selesai'], $data['kuota'],
    ]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function jadwal_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $fields = [];
    $params = [];
    foreach (['hari','jam_mulai','jam_selesai','kuota','is_aktif'] as $f) {
        if (isset($data[$f])) { $fields[] = "{$f}=?"; $params[] = $data[$f]; }
    }
    if (empty($fields)) return ['success' => true];
    $params[] = (int)$data['id'];
    $pdo->prepare("UPDATE jadwal_dokter SET " . implode(',', $fields) . " WHERE id=?")
        ->execute($params);
    return ['success' => true];
}

// =============================================================================
// DIAGNOSA
// =============================================================================

function diagnosa_search(PDO $pdo, array $data): array
{
    $q    = '%' . ($data['q'] ?? '') . '%';
    $stmt = $pdo->prepare(
        "SELECT id, kode_icd10, nama_diagnosa FROM diagnosa
         WHERE kode_icd10 LIKE ? OR nama_diagnosa LIKE ?
         ORDER BY kode_icd10 ASC LIMIT 20"
    );
    $stmt->execute([$q, $q]);
    return ['data' => $stmt->fetchAll()];
}

// =============================================================================
// PENGATURAN
// =============================================================================

function pengaturan_get(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT * FROM pengaturan LIMIT 1");
    return $stmt->fetch() ?: [];
}

function pengaturan_update(PDO $pdo, array $data): array
{
    $pdo->prepare(
        "UPDATE pengaturan SET
            nama_klinik=?, alamat_klinik=?, no_telepon_klinik=?,
            batas_diskon_karyawan=?, footer_invoice=?
         WHERE id=1"
    )->execute([
        $data['nama_klinik']           ?? '',
        $data['alamat_klinik']         ?? '',
        $data['no_telepon_klinik']     ?? '',
        (int)($data['batas_diskon_karyawan'] ?? 20),
        $data['footer_invoice']        ?? '',
    ]);
    return ['success' => true];
}

// =============================================================================
// PASIEN
// =============================================================================

function pasien_index(PDO $pdo, array $data): array
{
    $page   = (int)($data['page'] ?? 1);
    $q      = '%' . ($data['q'] ?? '') . '%';
    $sql    = "SELECT id, no_rekam_medis, nik, nama_lengkap, no_telepon, no_whatsapp,
                      tanggal_lahir, jenis_kelamin, created_at
               FROM pasien
               WHERE nama_lengkap LIKE ? OR nik LIKE ? OR no_rekam_medis LIKE ?
               ORDER BY nama_lengkap ASC";
    return paginate($pdo, $sql, [$q, $q, $q], $page);
}

function pasien_search(PDO $pdo, array $data): array
{
    $q    = '%' . ($data['q'] ?? '') . '%';
    $stmt = $pdo->prepare(
        "SELECT id, no_rekam_medis, nik, nama_lengkap, no_telepon, no_whatsapp
         FROM pasien WHERE nama_lengkap LIKE ? OR nik LIKE ?
         ORDER BY nama_lengkap ASC LIMIT 10"
    );
    $stmt->execute([$q, $q]);
    return ['data' => $stmt->fetchAll()];
}

function pasien_show(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $stmt = $pdo->prepare("SELECT * FROM pasien WHERE id = ?");
    $stmt->execute([(int)$data['id']]);
    $pasien = $stmt->fetch();
    if (!$pasien) throw new BridgeException('Pasien tidak ditemukan', 404);
    return $pasien;
}

function pasien_store(PDO $pdo, array $data): array
{
    require_fields($data, ['nik', 'nama_lengkap', 'tanggal_lahir', 'jenis_kelamin']);
    $no_rm = generate_no_rekam_medis($pdo);
    $pdo->prepare(
        "INSERT INTO pasien
            (no_rekam_medis, nik, nama_lengkap, tempat_lahir, tanggal_lahir,
             jenis_kelamin, alamat, no_telepon, no_whatsapp,
             golongan_darah, alergi, catatan_kulit)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
    )->execute([
        $no_rm,
        $data['nik'],
        $data['nama_lengkap'],
        $data['tempat_lahir']   ?? '',
        $data['tanggal_lahir'],
        $data['jenis_kelamin'],
        $data['alamat']         ?? '',
        $data['no_telepon']     ?? '',
        $data['no_whatsapp']    ?? '',
        $data['golongan_darah'] ?? 'tidak_diketahui',
        $data['alergi']         ?? '',
        $data['catatan_kulit']  ?? '',
    ]);
    return ['id' => (int)$pdo->lastInsertId(), 'no_rekam_medis' => $no_rm];
}

function pasien_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_lengkap']);
    $pdo->prepare(
        "UPDATE pasien SET
            nama_lengkap=?, tempat_lahir=?, tanggal_lahir=?, jenis_kelamin=?,
            alamat=?, no_telepon=?, no_whatsapp=?, golongan_darah=?,
            alergi=?, catatan_kulit=?
         WHERE id=?"
    )->execute([
        $data['nama_lengkap'],
        $data['tempat_lahir']   ?? '',
        $data['tanggal_lahir']  ?? null,
        $data['jenis_kelamin']  ?? 'L',
        $data['alamat']         ?? '',
        $data['no_telepon']     ?? '',
        $data['no_whatsapp']    ?? '',
        $data['golongan_darah'] ?? 'tidak_diketahui',
        $data['alergi']         ?? '',
        $data['catatan_kulit']  ?? '',
        (int)$data['id'],
    ]);
    return ['success' => true];
}

function pasien_riwayat(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien']);
    $stmt = $pdo->prepare(
        "SELECT p.id, p.tanggal, p.no_antrian, p.status, p.jenis_kunjungan, p.keluhan_utama,
                pen.nama_lengkap as nama_dokter, l.nama_layanan,
                i.total, i.status as status_invoice
         FROM pendaftaran p
         JOIN dokter d ON d.id = p.id_dokter
         JOIN pengguna pen ON pen.id = d.id_pengguna
         LEFT JOIN layanan l ON l.id = p.id_layanan
         LEFT JOIN invoice i ON i.id_pendaftaran = p.id
         WHERE p.id_pasien = ?
         ORDER BY p.tanggal DESC, p.no_antrian DESC"
    );
    $stmt->execute([(int)$data['id_pasien']]);
    return ['data' => $stmt->fetchAll()];
}

// =============================================================================
// PENDAFTARAN & ANTRIAN
// =============================================================================

function antrian_hari_ini(PDO $pdo, array $data): array
{
    $params    = [date('Y-m-d')];
    $sql       = "SELECT p.id, p.no_antrian, p.status, p.keluhan_utama, p.jenis_kunjungan,
                         p.tanggal, p.created_at,
                         pas.nama_lengkap as nama_pasien, pas.no_rekam_medis,
                         pen.nama_lengkap as nama_dokter,
                         l.nama_layanan,
                         rm.id as id_rme, rm.status as status_rme
                  FROM pendaftaran p
                  JOIN pasien pas ON pas.id = p.id_pasien
                  JOIN dokter d ON d.id = p.id_dokter
                  JOIN pengguna pen ON pen.id = d.id_pengguna
                  LEFT JOIN layanan l ON l.id = p.id_layanan
                  LEFT JOIN rekam_medis rm ON rm.id_pendaftaran = p.id
                  WHERE p.tanggal = ?";

    // Filter by dokter jika role = dokter
    if (!empty($data['id_dokter'])) {
        $sql     .= " AND p.id_dokter = ?";
        $params[] = (int)$data['id_dokter'];
    }

    $sql .= " ORDER BY p.no_antrian ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return ['data' => $stmt->fetchAll()];
}

function pendaftaran_index(PDO $pdo, array $data): array
{
    $page   = (int)($data['page'] ?? 1);
    $params = [];
    $where  = [];

    if (!empty($data['tanggal'])) { $where[] = "p.tanggal = ?"; $params[] = $data['tanggal']; }
    if (!empty($data['status']))  { $where[] = "p.status = ?";  $params[] = $data['status'];  }
    if (!empty($data['id_dokter'])) { $where[] = "p.id_dokter = ?"; $params[] = (int)$data['id_dokter']; }

    $sql = "SELECT p.id, p.no_antrian, p.tanggal, p.status, p.jenis_kunjungan,
                   pas.nama_lengkap as nama_pasien,
                   pen.nama_lengkap as nama_dokter
            FROM pendaftaran p
            JOIN pasien pas ON pas.id = p.id_pasien
            JOIN dokter d ON d.id = p.id_dokter
            JOIN pengguna pen ON pen.id = d.id_pengguna";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY p.tanggal DESC, p.no_antrian DESC";
    return paginate($pdo, $sql, $params, $page);
}

function pendaftaran_show(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $stmt = $pdo->prepare(
        "SELECT p.*,
                pas.nama_lengkap as nama_pasien, pas.no_rekam_medis,
                pas.no_whatsapp, pas.alergi, pas.catatan_kulit,
                pen.nama_lengkap as nama_dokter,
                l.nama_layanan, l.harga as harga_layanan
         FROM pendaftaran p
         JOIN pasien pas ON pas.id = p.id_pasien
         JOIN dokter d ON d.id = p.id_dokter
         JOIN pengguna pen ON pen.id = d.id_pengguna
         LEFT JOIN layanan l ON l.id = p.id_layanan
         WHERE p.id = ?"
    );
    $stmt->execute([(int)$data['id']]);
    $row = $stmt->fetch();
    if (!$row) throw new BridgeException('Pendaftaran tidak ditemukan', 404);
    return $row;
}

function pendaftaran_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien', 'id_dokter', 'id_layanan', 'id_karyawan',
                           'keluhan_utama', 'jenis_kunjungan']);
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // Cek kuota
    $stmt = $pdo->prepare(
        "SELECT j.kuota,
                (SELECT COUNT(*) FROM pendaftaran
                 WHERE id_dokter=? AND tanggal=? AND status != 'batal') as terisi
         FROM jadwal_dokter j
         WHERE j.id_dokter = ? AND j.hari = LOWER(DAYNAME(?)) AND j.is_aktif = 1
         LIMIT 1"
    );
    $stmt->execute([$data['id_dokter'], $tanggal, $data['id_dokter'], $tanggal]);
    $jadwal = $stmt->fetch();
    if ($jadwal && (int)$jadwal['terisi'] >= (int)$jadwal['kuota']) {
        throw new BridgeException('Kuota dokter hari ini sudah penuh');
    }

    $no_antrian = generate_no_antrian($pdo, $tanggal);
    $pdo->prepare(
        "INSERT INTO pendaftaran
            (no_antrian, id_pasien, id_dokter, id_layanan, id_karyawan,
             tanggal, keluhan_utama, jenis_kunjungan, status, catatan)
         VALUES (?,?,?,?,?,?,?,?,'menunggu',?)"
    )->execute([
        $no_antrian, $data['id_pasien'], $data['id_dokter'],
        $data['id_layanan'], $data['id_karyawan'],
        $tanggal, $data['keluhan_utama'], $data['jenis_kunjungan'],
        $data['catatan'] ?? '',
    ]);
    return ['id' => (int)$pdo->lastInsertId(), 'no_antrian' => $no_antrian];
}

function pendaftaran_updateStatus(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'status']);
    $valid = ['menunggu','dipanggil','selesai','batal'];
    if (!in_array($data['status'], $valid)) {
        throw new BridgeException('Status tidak valid');
    }
    $pdo->prepare("UPDATE pendaftaran SET status=? WHERE id=?")
        ->execute([$data['status'], (int)$data['id']]);
    return ['success' => true];
}

function pendaftaran_batal(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $id = (int)$data['id'];

    // Ambil data pendaftaran + RME
    $stmt = $pdo->prepare(
        "SELECT p.status,
                rm.id as rme_id, rm.status as rme_status
         FROM pendaftaran p
         LEFT JOIN rekam_medis rm ON rm.id_pendaftaran = p.id
         WHERE p.id = ?"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) throw new BridgeException('Pendaftaran tidak ditemukan', 404);

    if ($row['status'] === 'selesai') {
        throw new BridgeException('Pendaftaran sudah selesai dan tidak dapat dibatalkan');
    }
    if ($row['rme_status'] === 'final') {
        throw new BridgeException('RME sudah difinalisasi — pendaftaran tidak dapat dibatalkan');
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE pendaftaran SET status='batal' WHERE id=?")->execute([$id]);
        if ($row['rme_id'] && $row['rme_status'] === 'draft') {
            $pdo->prepare("UPDATE rekam_medis SET status='batal' WHERE id=?")
                ->execute([(int)$row['rme_id']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    return ['success' => true];
}

// =============================================================================
// RME
// =============================================================================

function rme_index(PDO $pdo, array $data): array
{
    $page   = (int)($data['page'] ?? 1);
    $params = [];
    $where  = [];

    if (!empty($data['id_dokter'])) {
        $where[]  = "rm.id_dokter = ?";
        $params[] = (int)$data['id_dokter'];
    }
    $sql = "SELECT rm.id, rm.status, rm.created_at,
                   pas.nama_lengkap as nama_pasien,
                   pen.nama_lengkap as nama_dokter
            FROM rekam_medis rm
            JOIN pasien pas ON pas.id = rm.id_pasien
            JOIN dokter d ON d.id = rm.id_dokter
            JOIN pengguna pen ON pen.id = d.id_pengguna";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY rm.created_at DESC";
    return paginate($pdo, $sql, $params, $page);
}

function rme_show(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $stmt = $pdo->prepare(
        "SELECT rm.*,
                pas.nama_lengkap as nama_pasien, pas.no_rekam_medis,
                pen.nama_lengkap as nama_dokter,
                du.kode_icd10 as kode_diagnosa_utama, du.nama_diagnosa as nama_diagnosa_utama,
                ds.kode_icd10 as kode_diagnosa_sekunder, ds.nama_diagnosa as nama_diagnosa_sekunder
         FROM rekam_medis rm
         JOIN pasien pas ON pas.id = rm.id_pasien
         JOIN dokter d ON d.id = rm.id_dokter
         JOIN pengguna pen ON pen.id = d.id_pengguna
         LEFT JOIN diagnosa du ON du.id = rm.id_diagnosa_utama
         LEFT JOIN diagnosa ds ON ds.id = rm.id_diagnosa_sekunder
         WHERE rm.id = ?"
    );
    $stmt->execute([(int)$data['id']]);
    $rme = $stmt->fetch();
    if (!$rme) throw new BridgeException('RME tidak ditemukan', 404);

    // Tindakan
    $stmt = $pdo->prepare(
        "SELECT tp.id, tp.harga_saat_itu, tp.keterangan, l.nama_layanan
         FROM tindakan_pasien tp
         JOIN layanan l ON l.id = tp.id_layanan
         WHERE tp.id_rme = ?"
    );
    $stmt->execute([(int)$data['id']]);
    $rme['tindakan'] = $stmt->fetchAll();

    // Resep + detail
    $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
    $stmt->execute([(int)$data['id']]);
    $resep = $stmt->fetch();
    if ($resep) {
        $stmt = $pdo->prepare(
            "SELECT dr.id, dr.jumlah, dr.dosis, dr.aturan_pakai, dr.keterangan,
                    pr.nama_produk, pr.harga_jual, pr.stok
             FROM detail_resep dr
             JOIN produk pr ON pr.id = dr.id_produk
             WHERE dr.id_resep = ?"
        );
        $stmt->execute([(int)$resep['id']]);
        $rme['resep'] = ['id' => $resep['id'], 'items' => $stmt->fetchAll()];
    } else {
        $rme['resep'] = null;
    }

    return $rme;
}

function rme_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pendaftaran', 'id_pasien', 'id_dokter']);
    // Cek tidak ada RME duplikat
    $stmt = $pdo->prepare("SELECT id FROM rekam_medis WHERE id_pendaftaran = ?");
    $stmt->execute([(int)$data['id_pendaftaran']]);
    if ($stmt->fetch()) throw new BridgeException('RME untuk pendaftaran ini sudah ada');

    $pdo->prepare(
        "INSERT INTO rekam_medis
            (id_pendaftaran, id_pasien, id_dokter, subjektif, objektif,
             assesment, plan, kondisi_masuk, kondisi_keluar,
             instruksi_tindak_lanjut, id_diagnosa_utama, id_diagnosa_sekunder, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'draft')"
    )->execute([
        $data['id_pendaftaran'], $data['id_pasien'], $data['id_dokter'],
        $data['subjektif']               ?? '',
        $data['objektif']                ?? '',
        $data['assesment']               ?? '',
        $data['plan']                    ?? '',
        $data['kondisi_masuk']           ?? '',
        $data['kondisi_keluar']          ?? '',
        $data['instruksi_tindak_lanjut'] ?? '',
        $data['id_diagnosa_utama']       ?? null,
        $data['id_diagnosa_sekunder']    ?? null,
    ]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function rme_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    // Hanya bisa edit jika masih draft
    $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
    $stmt->execute([(int)$data['id']]);
    $row = $stmt->fetch();
    if (!$row) throw new BridgeException('RME tidak ditemukan', 404);
    if ($row['status'] !== 'draft') throw new BridgeException('RME sudah final — tidak dapat diedit');

    $pdo->prepare(
        "UPDATE rekam_medis SET
            subjektif=?, objektif=?, assesment=?, plan=?,
            kondisi_masuk=?, kondisi_keluar=?, instruksi_tindak_lanjut=?,
            id_diagnosa_utama=?, id_diagnosa_sekunder=?
         WHERE id=?"
    )->execute([
        $data['subjektif']               ?? '',
        $data['objektif']                ?? '',
        $data['assesment']               ?? '',
        $data['plan']                    ?? '',
        $data['kondisi_masuk']           ?? '',
        $data['kondisi_keluar']          ?? '',
        $data['instruksi_tindak_lanjut'] ?? '',
        $data['id_diagnosa_utama']       ?? null,
        $data['id_diagnosa_sekunder']    ?? null,
        (int)$data['id'],
    ]);
    return ['success' => true];
}

function rme_finalisasi(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_pendaftaran']);

    $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
    $stmt->execute([(int)$data['id']]);
    $rme = $stmt->fetch();
    if (!$rme) throw new BridgeException('RME tidak ditemukan', 404);
    if ($rme['status'] !== 'draft') throw new BridgeException('RME tidak dalam status draft');

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE rekam_medis SET status='final' WHERE id=?")
            ->execute([(int)$data['id']]);
        $pdo->prepare("UPDATE pendaftaran SET status='selesai' WHERE id=?")
            ->execute([(int)$data['id_pendaftaran']]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    return ['success' => true];
}

function tindakan_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_rme', 'id_layanan']);
    // Ambil harga saat ini
    $stmt = $pdo->prepare("SELECT harga FROM layanan WHERE id = ?");
    $stmt->execute([(int)$data['id_layanan']]);
    $layanan = $stmt->fetch();
    if (!$layanan) throw new BridgeException('Layanan tidak ditemukan', 404);

    $pdo->prepare(
        "INSERT INTO tindakan_pasien (id_rme, id_layanan, harga_saat_itu, keterangan)
         VALUES (?,?,?,?)"
    )->execute([
        $data['id_rme'], $data['id_layanan'],
        $layanan['harga'],
        $data['keterangan'] ?? '',
    ]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function tindakan_delete(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_rme']);
    // Pastikan RME masih draft sebelum hapus tindakan
    $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
    $stmt->execute([(int)$data['id_rme']]);
    $rme = $stmt->fetch();
    if (!$rme || $rme['status'] !== 'draft') {
        throw new BridgeException('Tidak dapat menghapus tindakan — RME sudah final');
    }
    $pdo->prepare("DELETE FROM tindakan_pasien WHERE id=? AND id_rme=?")
        ->execute([(int)$data['id'], (int)$data['id_rme']]);
    return ['success' => true];
}

function resep_storeItem(PDO $pdo, array $data): array
{
    require_fields($data, ['id_rme', 'id_produk', 'jumlah']);

    // Buat tabel resep jika belum ada untuk RME ini
    $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
    $stmt->execute([(int)$data['id_rme']]);
    $resep = $stmt->fetch();
    if (!$resep) {
        $pdo->prepare("INSERT INTO resep (id_rme, catatan) VALUES (?,?)")
            ->execute([$data['id_rme'], $data['catatan_resep'] ?? '']);
        $id_resep = (int)$pdo->lastInsertId();
    } else {
        $id_resep = (int)$resep['id'];
    }

    // Cek stok (warning saja — tidak blocking)
    $stmt = $pdo->prepare("SELECT stok, nama_produk FROM produk WHERE id = ?");
    $stmt->execute([(int)$data['id_produk']]);
    $produk = $stmt->fetch();
    $stok_warning = $produk && $produk['stok'] < (int)$data['jumlah'];

    $pdo->prepare(
        "INSERT INTO detail_resep (id_resep, id_produk, jumlah, dosis, aturan_pakai, keterangan)
         VALUES (?,?,?,?,?,?)"
    )->execute([
        $id_resep, $data['id_produk'], $data['jumlah'],
        $data['dosis']       ?? '',
        $data['aturan_pakai'] ?? '',
        $data['keterangan']  ?? '',
    ]);

    return [
        'id'           => (int)$pdo->lastInsertId(),
        'id_resep'     => $id_resep,
        'stok_warning' => $stok_warning,
        'stok_tersisa' => $produk['stok'] ?? 0,
        'nama_produk'  => $produk['nama_produk'] ?? '',
    ];
}

function resep_deleteItem(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_rme']);
    $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
    $stmt->execute([(int)$data['id_rme']]);
    $rme = $stmt->fetch();
    if (!$rme || $rme['status'] !== 'draft') {
        throw new BridgeException('Tidak dapat menghapus item resep — RME sudah final');
    }
    $pdo->prepare("DELETE FROM detail_resep WHERE id=?")->execute([(int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// INVOICE & KASIR
// =============================================================================

function invoice_index(PDO $pdo, array $data): array
{
    $page   = (int)($data['page'] ?? 1);
    $params = [];
    $where  = [];

    if (!empty($data['status']))  { $where[] = "i.status = ?";   $params[] = $data['status'];  }
    if (!empty($data['tanggal'])) { $where[] = "DATE(i.created_at) = ?"; $params[] = $data['tanggal']; }

    $sql = "SELECT i.id, i.no_invoice, i.subtotal, i.diskon, i.total,
                   i.total_dibayar, i.status, i.created_at,
                   pas.nama_lengkap as nama_pasien,
                   pen.nama_lengkap as nama_dokter
            FROM invoice i
            JOIN pendaftaran p ON p.id = i.id_pendaftaran
            JOIN pasien pas ON pas.id = p.id_pasien
            JOIN dokter d ON d.id = p.id_dokter
            JOIN pengguna pen ON pen.id = d.id_pengguna";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY i.created_at DESC";
    return paginate($pdo, $sql, $params, $page);
}

function invoice_show(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $stmt = $pdo->prepare(
        "SELECT i.*,
                pas.nama_lengkap as nama_pasien, pas.no_rekam_medis,
                pas.alamat as alamat_pasien, pas.no_whatsapp,
                pen.nama_lengkap as nama_karyawan,
                dok.nama_lengkap as nama_dokter
         FROM invoice i
         JOIN pendaftaran pend ON pend.id = i.id_pendaftaran
         JOIN pasien pas ON pas.id = pend.id_pasien
         JOIN pengguna pen ON pen.id = i.id_karyawan
         JOIN dokter d ON d.id = pend.id_dokter
         JOIN pengguna dok ON dok.id = d.id_pengguna
         WHERE i.id = ?"
    );
    $stmt->execute([(int)$data['id']]);
    $inv = $stmt->fetch();
    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);

    // Detail items
    $stmt = $pdo->prepare(
        "SELECT * FROM detail_invoice WHERE id_invoice = ? ORDER BY jenis, id ASC"
    );
    $stmt->execute([(int)$data['id']]);
    $inv['items'] = $stmt->fetchAll();

    // Riwayat pembayaran
    $stmt = $pdo->prepare(
        "SELECT pb.*, pen.nama_lengkap as nama_karyawan
         FROM pembayaran pb
         JOIN pengguna pen ON pen.id = pb.id_karyawan
         WHERE pb.id_invoice = ?
         ORDER BY pb.waktu_bayar ASC"
    );
    $stmt->execute([(int)$data['id']]);
    $inv['pembayaran'] = $stmt->fetchAll();

    return $inv;
}

function invoice_generate(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pendaftaran', 'id_karyawan']);
    $id_pendaftaran = (int)$data['id_pendaftaran'];

    // Cek sudah ada invoice belum
    $stmt = $pdo->prepare("SELECT id FROM invoice WHERE id_pendaftaran = ?");
    $stmt->execute([$id_pendaftaran]);
    if ($stmt->fetch()) throw new BridgeException('Invoice untuk pendaftaran ini sudah dibuat');

    // Ambil data pendaftaran
    $stmt = $pdo->prepare(
        "SELECT p.*, l.nama_layanan, l.harga as harga_layanan,
                rm.id as id_rme
         FROM pendaftaran p
         LEFT JOIN layanan l ON l.id = p.id_layanan
         LEFT JOIN rekam_medis rm ON rm.id_pendaftaran = p.id
         WHERE p.id = ? AND p.status = 'selesai'"
    );
    $stmt->execute([$id_pendaftaran]);
    $pend = $stmt->fetch();
    if (!$pend) throw new BridgeException('Pendaftaran tidak ditemukan atau belum selesai', 404);

    $items    = [];
    $subtotal = 0;

    // Item 1: Layanan utama dari pendaftaran
    if ($pend['id_layanan'] && $pend['harga_layanan']) {
        $items[] = [
            'jenis'        => 'layanan',
            'id_referensi' => (int)$pend['id_layanan'],
            'nama_item'    => $pend['nama_layanan'],
            'qty'          => 1,
            'harga_satuan' => (float)$pend['harga_layanan'],
            'subtotal'     => (float)$pend['harga_layanan'],
        ];
        $subtotal += (float)$pend['harga_layanan'];
    }

    // Item 2+: Tindakan dari RME
    if ($pend['id_rme']) {
        $stmt = $pdo->prepare(
            "SELECT tp.id, tp.harga_saat_itu, l.nama_layanan, tp.keterangan
             FROM tindakan_pasien tp
             JOIN layanan l ON l.id = tp.id_layanan
             WHERE tp.id_rme = ?"
        );
        $stmt->execute([$pend['id_rme']]);
        foreach ($stmt->fetchAll() as $t) {
            $items[] = [
                'jenis'        => 'tindakan',
                'id_referensi' => (int)$t['id'],
                'nama_item'    => $t['nama_layanan'] . ($t['keterangan'] ? ' - ' . $t['keterangan'] : ''),
                'qty'          => 1,
                'harga_satuan' => (float)$t['harga_saat_itu'],
                'subtotal'     => (float)$t['harga_saat_itu'],
            ];
            $subtotal += (float)$t['harga_saat_itu'];
        }

        // Item 3+: Produk dari resep
        $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
        $stmt->execute([$pend['id_rme']]);
        $resep = $stmt->fetch();
        if ($resep) {
            $stmt = $pdo->prepare(
                "SELECT dr.id, dr.jumlah, pr.nama_produk, pr.harga_jual
                 FROM detail_resep dr
                 JOIN produk pr ON pr.id = dr.id_produk
                 WHERE dr.id_resep = ?"
            );
            $stmt->execute([(int)$resep['id']]);
            foreach ($stmt->fetchAll() as $r) {
                $sub     = (float)$r['harga_jual'] * (int)$r['jumlah'];
                $items[] = [
                    'jenis'        => 'produk',
                    'id_referensi' => (int)$r['id'], // id detail_resep untuk traceability
                    'nama_item'    => $r['nama_produk'],
                    'qty'          => (int)$r['jumlah'],
                    'harga_satuan' => (float)$r['harga_jual'],
                    'subtotal'     => $sub,
                ];
                $subtotal += $sub;
            }
        }
    }

    $no_invoice = generate_no_invoice($pdo);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            "INSERT INTO invoice
                (no_invoice, id_pendaftaran, id_karyawan, subtotal, diskon, total, total_dibayar, status)
             VALUES (?,?,?,?,0,?,0,'belum_bayar')"
        )->execute([$no_invoice, $id_pendaftaran, $data['id_karyawan'], $subtotal, $subtotal]);
        $id_invoice = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare(
            "INSERT INTO detail_invoice
                (id_invoice, jenis, id_referensi, nama_item, qty, harga_satuan, subtotal)
             VALUES (?,?,?,?,?,?,?)"
        );
        foreach ($items as $item) {
            $stmt->execute([
                $id_invoice, $item['jenis'], $item['id_referensi'],
                $item['nama_item'], $item['qty'], $item['harga_satuan'], $item['subtotal'],
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return ['id' => $id_invoice, 'no_invoice' => $no_invoice, 'subtotal' => $subtotal];
}

function invoice_applyDiskon(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'diskon']);
    $id    = (int)$data['id'];
    $diskon = (float)$data['diskon'];

    $stmt = $pdo->prepare("SELECT subtotal, status FROM invoice WHERE id=?");
    $stmt->execute([$id]);
    $inv = $stmt->fetch();
    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);
    if ($inv['status'] !== 'belum_bayar') throw new BridgeException('Diskon hanya bisa diberikan pada invoice belum bayar');
    if ($diskon < 0 || $diskon > (float)$inv['subtotal']) throw new BridgeException('Diskon tidak valid');

    $total = (float)$inv['subtotal'] - $diskon;
    $pdo->prepare("UPDATE invoice SET diskon=?, total=? WHERE id=?")->execute([$diskon, $total, $id]);
    return ['success' => true, 'total' => $total];
}

function invoice_batal(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $stmt = $pdo->prepare("SELECT status FROM invoice WHERE id=?");
    $stmt->execute([(int)$data['id']]);
    $inv = $stmt->fetch();
    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);
    if ($inv['status'] !== 'belum_bayar') {
        throw new BridgeException('Hanya invoice belum_bayar yang dapat dibatalkan');
    }
    // Cek apakah sudah ada pembayaran masuk
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(nominal),0) as total FROM pembayaran WHERE id_invoice=?");
    $stmt->execute([(int)$data['id']]);
    if ((float)$stmt->fetchColumn() > 0) {
        throw new BridgeException('Invoice sudah memiliki riwayat pembayaran');
    }
    $pdo->prepare("UPDATE invoice SET status='batal' WHERE id=?")->execute([(int)$data['id']]);
    return ['success' => true];
}

function pembayaran_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_invoice', 'id_karyawan', 'metode', 'nominal']);
    $id_invoice = (int)$data['id_invoice'];
    $nominal    = (float)$data['nominal'];
    $metode     = $data['metode'];
    $kembalian  = 0.0;

    $valid_metode = ['tunai','transfer','qris','debit'];
    if (!in_array($metode, $valid_metode)) throw new BridgeException('Metode pembayaran tidak valid');

    $stmt = $pdo->prepare("SELECT total, total_dibayar, status FROM invoice WHERE id=?");
    $stmt->execute([$id_invoice]);
    $inv = $stmt->fetch();
    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);
    if ($inv['status'] === 'lunas') throw new BridgeException('Invoice sudah lunas');
    if ($inv['status'] === 'batal') throw new BridgeException('Invoice sudah dibatalkan');

    $sisa = (float)$inv['total'] - (float)$inv['total_dibayar'];

    if ($metode === 'tunai') {
        $kembalian = max(0, $nominal - $sisa);
    } else {
        if ($nominal > $sisa) {
            throw new BridgeException(
                'Nominal melebihi sisa tagihan (' . number_format($sisa, 0, ',', '.') . ')'
            );
        }
    }

    $efektif      = $nominal - $kembalian;
    $total_dibayar = (float)$inv['total_dibayar'] + $efektif;

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            "INSERT INTO pembayaran (id_invoice, id_karyawan, metode, nominal, kembalian, waktu_bayar)
             VALUES (?,?,?,?,?,NOW())"
        )->execute([$id_invoice, $data['id_karyawan'], $metode, $nominal, $kembalian]);

        $pdo->prepare("UPDATE invoice SET total_dibayar=? WHERE id=?")
            ->execute([$total_dibayar, $id_invoice]);

        // Cek apakah sudah lunas
        $lunas = $total_dibayar >= (float)$inv['total'];
        if ($lunas) {
            $pdo->prepare("UPDATE invoice SET status='lunas' WHERE id=?")->execute([$id_invoice]);
            // Deduct stok produk
            $stmt = $pdo->prepare(
                "SELECT di.id_referensi, di.qty
                 FROM detail_invoice di
                 WHERE di.id_invoice = ? AND di.jenis = 'produk'"
            );
            $stmt->execute([$id_invoice]);
            $produk_items = $stmt->fetchAll();
            foreach ($produk_items as $pi) {
                // id_referensi = detail_resep.id, perlu ambil id_produk
                $stmt2 = $pdo->prepare("SELECT id_produk FROM detail_resep WHERE id=?");
                $stmt2->execute([(int)$pi['id_referensi']]);
                $dr = $stmt2->fetch();
                if ($dr) {
                    $pdo->prepare("UPDATE produk SET stok = stok - ? WHERE id=? AND stok >= ?")
                        ->execute([(int)$pi['qty'], (int)$dr['id_produk'], (int)$pi['qty']]);
                }
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    return [
        'success'       => true,
        'lunas'         => $lunas ?? false,
        'kembalian'     => $kembalian,
        'total_dibayar' => $total_dibayar,
        'sisa'          => max(0, (float)$inv['total'] - $total_dibayar),
    ];
}

// =============================================================================
// FOLLOW UP WHATSAPP
// =============================================================================

function followup_index(PDO $pdo, array $data): array
{
    $page = (int)($data['page'] ?? 1);
    $sql  = "SELECT fw.id, fw.jenis, fw.status, fw.created_at,
                    pas.nama_lengkap as nama_pasien, fw.no_whatsapp
             FROM followup_wa fw
             JOIN pasien pas ON pas.id = fw.id_pasien
             ORDER BY fw.created_at DESC";
    return paginate($pdo, $sql, [], $page);
}

function followup_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien', 'id_pendaftaran', 'id_pengguna',
                           'no_whatsapp', 'pesan', 'wa_link', 'jenis']);
    $pdo->prepare(
        "INSERT INTO followup_wa
            (id_pasien, id_pendaftaran, id_pengguna, no_whatsapp, pesan, wa_link, jenis, status)
         VALUES (?,?,?,?,?,?,'draft')"
    )->execute([
        $data['id_pasien'], $data['id_pendaftaran'], $data['id_pengguna'],
        $data['no_whatsapp'], $data['pesan'], $data['wa_link'], $data['jenis'],
    ]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function followup_tandaiTerkirim(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $pdo->prepare("UPDATE followup_wa SET status='terkirim' WHERE id=?")
        ->execute([(int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// LAPORAN
// =============================================================================

function laporan_harian(PDO $pdo, array $data): array
{
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // Total pendapatan hari ini
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(total),0) as total_pendapatan,
                COUNT(*) as total_invoice
         FROM invoice
         WHERE DATE(created_at) = ? AND status = 'lunas'"
    );
    $stmt->execute([$tanggal]);
    $keuangan = $stmt->fetch();

    // Breakdown per metode bayar
    $stmt = $pdo->prepare(
        "SELECT pb.metode, COALESCE(SUM(pb.nominal - pb.kembalian),0) as total
         FROM pembayaran pb
         JOIN invoice i ON i.id = pb.id_invoice
         WHERE DATE(pb.waktu_bayar) = ? AND i.status = 'lunas'
         GROUP BY pb.metode"
    );
    $stmt->execute([$tanggal]);
    $per_metode = $stmt->fetchAll();

    // Total pasien
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN jenis_kunjungan='baru' THEN 1 ELSE 0 END) as pasien_baru,
                SUM(CASE WHEN jenis_kunjungan!='baru' THEN 1 ELSE 0 END) as pasien_lama
         FROM pendaftaran
         WHERE tanggal = ? AND status != 'batal'"
    );
    $stmt->execute([$tanggal]);
    $pasien = $stmt->fetch();

    // Daftar invoice hari ini
    $stmt = $pdo->prepare(
        "SELECT i.no_invoice, i.total, i.status,
                pas.nama_lengkap as nama_pasien
         FROM invoice i
         JOIN pendaftaran p ON p.id = i.id_pendaftaran
         JOIN pasien pas ON pas.id = p.id_pasien
         WHERE DATE(i.created_at) = ?
         ORDER BY i.created_at ASC"
    );
    $stmt->execute([$tanggal]);
    $invoice_list = $stmt->fetchAll();

    return [
        'tanggal'          => $tanggal,
        'total_pendapatan' => $keuangan['total_pendapatan'],
        'total_invoice'    => $keuangan['total_invoice'],
        'per_metode'       => $per_metode,
        'total_pasien'     => $pasien['total'],
        'pasien_baru'      => $pasien['pasien_baru'],
        'pasien_lama'      => $pasien['pasien_lama'],
        'invoices'         => $invoice_list,
    ];
}

function laporan_bulanan(PDO $pdo, array $data): array
{
    $bulan  = $data['bulan']  ?? date('m');
    $tahun  = $data['tahun']  ?? date('Y');
    $prefix = "{$tahun}-{$bulan}";

    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(total),0) as total_pendapatan,
                COUNT(*) as total_invoice
         FROM invoice
         WHERE DATE_FORMAT(created_at,'%Y-%m') = ? AND status = 'lunas'"
    );
    $stmt->execute([$prefix]);
    $keuangan = $stmt->fetch();

    $stmt = $pdo->prepare(
        "SELECT pb.metode, COALESCE(SUM(pb.nominal - pb.kembalian),0) as total
         FROM pembayaran pb
         JOIN invoice i ON i.id = pb.id_invoice
         WHERE DATE_FORMAT(pb.waktu_bayar,'%Y-%m') = ? AND i.status = 'lunas'
         GROUP BY pb.metode"
    );
    $stmt->execute([$prefix]);
    $per_metode = $stmt->fetchAll();

    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN jenis_kunjungan='baru' THEN 1 ELSE 0 END) as pasien_baru,
                SUM(CASE WHEN jenis_kunjungan!='baru' THEN 1 ELSE 0 END) as pasien_lama
         FROM pendaftaran
         WHERE DATE_FORMAT(tanggal,'%Y-%m') = ? AND status != 'batal'"
    );
    $stmt->execute([$prefix]);
    $pasien = $stmt->fetch();

    // Ringkasan per hari dalam bulan itu
    $stmt = $pdo->prepare(
        "SELECT DATE(created_at) as hari,
                COUNT(*) as jumlah_invoice,
                SUM(total) as pendapatan
         FROM invoice
         WHERE DATE_FORMAT(created_at,'%Y-%m') = ? AND status = 'lunas'
         GROUP BY DATE(created_at)
         ORDER BY hari ASC"
    );
    $stmt->execute([$prefix]);
    $per_hari = $stmt->fetchAll();

    return [
        'bulan'            => (int)$bulan,
        'tahun'            => (int)$tahun,
        'total_pendapatan' => $keuangan['total_pendapatan'],
        'total_invoice'    => $keuangan['total_invoice'],
        'per_metode'       => $per_metode,
        'total_pasien'     => $pasien['total'],
        'pasien_baru'      => $pasien['pasien_baru'],
        'pasien_lama'      => $pasien['pasien_lama'],
        'per_hari'         => $per_hari,
    ];
}
