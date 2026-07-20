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

/**
 * NEW HELPER: Safely execute queries and catch exact SQL errors.
 */
function safe_query(PDO $pdo, string $sql, array $params = []): void
{
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage() . ' | Query: ' . $sql);
    }
}

function paginate(PDO $pdo, string $sql, array $params, int $page, int $per_page = 15): array
{
    $offset = ($page - 1) * $per_page;

    // Total count
    $count_sql = "SELECT COUNT(*) as total FROM ({$sql}) as sub";
    try {
        $stmt = $pdo->prepare($count_sql);
        $stmt->execute($params);
        $total = (int) $stmt->fetchColumn();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Count): ' . $e->getMessage());
    }

    // Data
    try {
        $stmt = $pdo->prepare("{$sql} LIMIT {$per_page} OFFSET {$offset}");
        $stmt->execute($params);
        $items = $stmt->fetchAll();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Paginate): ' . $e->getMessage());
    }

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
    try {
        $stmt = $pdo->query("SELECT MAX(CAST(SUBSTRING(no_rekam_medis, 3) AS UNSIGNED)) FROM pasien WHERE no_rekam_medis LIKE 'RM%'");
        $max_num = (int) $stmt->fetchColumn();
        $next_num = $max_num > 0 ? $max_num + 1 : 1;
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
    return 'RM' . str_pad((string)$next_num, 6, '0', STR_PAD_LEFT);
}

function generate_no_antrian(PDO $pdo, string $tanggal): int
{
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM pendaftaran WHERE tanggal = ? AND status != 'batal'");
        $stmt->execute([$tanggal]);
        return (int) $stmt->fetchColumn() + 1;
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function generate_no_invoice(PDO $pdo): string
{
    try {
        $prefix = 'INV' . date('Ymd');
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM invoice WHERE no_invoice LIKE ?");
        $stmt->execute([$prefix . '%']);
        $count = (int) $stmt->fetchColumn();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
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
        'layanan.delete'             => layanan_delete($pdo, $data),

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
        'rme.getOrCreate'            => rme_get_or_create($pdo, $data),
        'rme.show'                   => rme_show($pdo, $data),
        'rme.store'                  => rme_store($pdo, $data),
        'rme.update'                 => rme_update($pdo, $data),
        'rme.finalisasi'             => rme_finalisasi($pdo, $data),
        'rme.index'                  => rme_index($pdo, $data),
        'tindakan.store'             => tindakan_store($pdo, $data),
        'tindakan.delete'            => tindakan_delete($pdo, $data),
        'resep.storeItem'            => resep_storeItem($pdo, $data),
        'resep.deleteItem'           => resep_deleteItem($pdo, $data),
        'resep.getByRme'             => resep_getByRme($pdo, $data),

        // ── Invoice ───────────────────────────────────────────────────────────
        'invoice.index'              => invoice_index($pdo, $data),
        'invoice.show'               => invoice_show($pdo, $data),
        'invoice.generate'           => invoice_generate($pdo, $data),
        'invoice.applyDiskon'        => invoice_applyDiskon($pdo, $data),
        'invoice.batal'              => invoice_batal($pdo, $data),
        'pembayaran.store'           => pembayaran_store($pdo, $data),
        'invoice.generateMissing'    => invoice_generateMissing($pdo, $data),

        // ── Follow Up WA ──────────────────────────────────────────────────────
        'followup.index'             => followup_index($pdo, $data),
        'followup.store'             => followup_store($pdo, $data),
        'followup.tandaiTerkirim'    => followup_tandaiTerkirim($pdo, $data),

        // ── Laporan ───────────────────────────────────────────────────────────
        'laporan.harian'             => laporan_harian($pdo, $data),
        'laporan.bulanan'           => laporan_bulanan($pdo, $data),
        'laporan.layanan'           => laporan_layanan($pdo, $data),
        'laporan.produk'            => laporan_produk($pdo, $data),
        'laporan.dokter'            => laporan_dokter($pdo, $data),
        'laporan.rme'               => laporan_rme($pdo, $data),
        'laporan.range'             => laporan_range($pdo, $data),

        // ── Pendaftaran (tambahan) ────────────────────────────────────────────────────
        'pendaftaran.belumBayar'     => pendaftaran_belumBayar($pdo, $data),
        'pendaftaran.lunas'          => pendaftaran_lunas($pdo, $data),


        // ── RME (tambahan) ────────────────────────────────────────────────────────────
        'rme.latestPerPasien'        => rme_latestPerPasien($pdo, $data),
        'rme.latestByPatient'        => rme_latestByPatient($pdo, $data),
        
        // ── Paket Layanan ───────────────────────────────────────────────────────
          'paket_layanan.index'         => paket_layanan_index($pdo, $data),
          'paket_layanan.show'          => paket_layanan_show($pdo, $data),
          'paket_layanan.store'         => paket_layanan_store($pdo, $data),
          'paket_layanan.update'        => paket_layanan_update($pdo, $data),
          'paket_layanan.delete'        => paket_layanan_delete($pdo, $data),
          'paket_layanan.pasien_datang' => paket_layanan_pasien_datang($pdo, $data),

        default => throw new BridgeException("Unknown action: {$action}", 404),
    };
}

// =============================================================================
// AUTH
// =============================================================================

function auth_findByUsername(PDO $pdo, array $data): array
{
    require_fields($data, ['username', 'password']);
    try {
        $stmt = $pdo->prepare(
            "SELECT id, nama_lengkap, username, password, role
             FROM pengguna
             WHERE username = ? AND password = ? AND is_aktif = 1
             LIMIT 1"
        );
        $stmt->execute([$data['username'], $data['password']]);
        $user = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
    
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
    if (!in_array($data['role'], ['admin', 'dokter', 'karyawan','kasir'])) {
        throw new BridgeException('Role tidak valid');
    }
    // Cek username unik
    try {
        $stmt = $pdo->prepare("SELECT id FROM pengguna WHERE username = ?");
        $stmt->execute([$data['username']]);
        if ($stmt->fetch()) throw new BridgeException('Username sudah digunakan');
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    safe_query($pdo,
        "INSERT INTO pengguna (nama_lengkap, username, password, role, is_aktif)
         VALUES (?, ?, ?, ?, 1)",
        [$data['nama_lengkap'], $data['username'], $data['password'], $data['role']]
    );
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

    safe_query($pdo, $sql, $params);
    return ['success' => true];
}

function pengguna_toggleAktif(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    safe_query($pdo, "UPDATE pengguna SET is_aktif = NOT is_aktif WHERE id = ? AND role != 'superadmin'", [(int)$data['id']]);
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
    
    try {
        $stmt = $pdo->query($sql);
        return ['data' => $stmt->fetchAll()];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function dokter_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pengguna', 'id_spesialisasi', 'no_sip']);
    safe_query($pdo,
        "INSERT INTO dokter (id_pengguna, id_spesialisasi, no_sip, is_aktif)
         VALUES (?, ?, ?, 1)",
        [$data['id_pengguna'], $data['id_spesialisasi'], $data['no_sip']]
    );
    return ['id' => (int)$pdo->lastInsertId()];
}

function dokter_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_spesialisasi', 'no_sip']);
    safe_query($pdo,
        "UPDATE dokter SET id_spesialisasi=?, no_sip=? WHERE id=?",
        [$data['id_spesialisasi'], $data['no_sip'], (int)$data['id']]
    );
    return ['success' => true];
}

function dokter_toggleAktif(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    safe_query($pdo, "UPDATE dokter SET is_aktif = NOT is_aktif WHERE id=?", [(int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// SPESIALISASI
// =============================================================================

function spesialisasi_index(PDO $pdo, array $data): array
{
    try {
        $stmt = $pdo->query("SELECT * FROM spesialisasi ORDER BY nama_spesialisasi ASC");
        return ['data' => $stmt->fetchAll()];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function spesialisasi_store(PDO $pdo, array $data): array
{
    require_fields($data, ['nama_spesialisasi']);
    safe_query($pdo, "INSERT INTO spesialisasi (nama_spesialisasi) VALUES (?)", [$data['nama_spesialisasi']]);
    return ['id' => (int)$pdo->lastInsertId()];
}

function spesialisasi_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_spesialisasi']);
    safe_query($pdo, "UPDATE spesialisasi SET nama_spesialisasi=? WHERE id=?", [$data['nama_spesialisasi'], (int)$data['id']]);
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
    safe_query($pdo,
        "INSERT INTO layanan (nama_layanan, kategori, harga, durasi_menit, is_aktif)
         VALUES (?, ?, ?, ?, 1)",
        [$data['nama_layanan'], $data['kategori'], $data['harga'], $data['durasi_menit'] ?? 30]
    );
    return ['id' => (int)$pdo->lastInsertId()];
}

function layanan_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_layanan', 'kategori', 'harga']);
    if (isset($data['is_aktif'])) {
        safe_query($pdo,
            "UPDATE layanan SET nama_layanan=?, kategori=?, harga=?, durasi_menit=?, is_aktif=? WHERE id=?",
            [$data['nama_layanan'], $data['kategori'], $data['harga'], $data['durasi_menit'] ?? 30, (int)$data['is_aktif'], (int)$data['id']]
        );
    } else {
        safe_query($pdo,
            "UPDATE layanan SET nama_layanan=?, kategori=?, harga=?, durasi_menit=? WHERE id=?",
            [$data['nama_layanan'], $data['kategori'], $data['harga'], $data['durasi_menit'] ?? 30, (int)$data['id']]
        );
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
    safe_query($pdo,
        "INSERT INTO produk (nama_produk, kategori, satuan, harga_jual, stok, stok_minimum, is_aktif)
         VALUES (?, ?, ?, ?, ?, ?, 1)",
        [$data['nama_produk'], $data['kategori'], $data['satuan'], $data['harga_jual'], $data['stok'] ?? 0, $data['stok_minimum'] ?? 5]
    );
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
    
    safe_query($pdo, "UPDATE produk SET {$fields} WHERE id=?", $params);
    return ['success' => true];
}

function produk_deductStok(PDO $pdo, array $data): array
{
    require_fields($data, ['items']);
    $pdo->beginTransaction();
    try {
        foreach ($data['items'] as $item) {
            safe_query($pdo, "UPDATE produk SET stok = stok - ? WHERE id = ? AND stok >= ?", [(int)$item['qty'], (int)$item['id_produk'], (int)$item['qty']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw new BridgeException('Stok deduction failed: ' . $e->getMessage());
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
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return ['data' => $stmt->fetchAll()];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function jadwal_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_dokter', 'hari', 'jam_mulai', 'jam_selesai', 'kuota']);
    safe_query($pdo,
        "INSERT INTO jadwal_dokter (id_dokter, hari, jam_mulai, jam_selesai, kuota, is_aktif)
         VALUES (?, ?, ?, ?, ?, 1)",
        [$data['id_dokter'], $data['hari'], $data['jam_mulai'], $data['jam_selesai'], $data['kuota']]
    );
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
    
    safe_query($pdo, "UPDATE jadwal_dokter SET " . implode(',', $fields) . " WHERE id=?", $params);
    return ['success' => true];
}

// =============================================================================
// DIAGNOSA
// =============================================================================

function diagnosa_search(PDO $pdo, array $data): array
{
    $q    = '%' . ($data['q'] ?? '') . '%';
    try {
        $stmt = $pdo->prepare(
            "SELECT id, kode_icd10, nama_diagnosa FROM diagnosa
             WHERE kode_icd10 LIKE ? OR nama_diagnosa LIKE ?
             ORDER BY kode_icd10 ASC LIMIT 20"
        );
        $stmt->execute([$q, $q]);
        return ['data' => $stmt->fetchAll()];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

// =============================================================================
// PENGATURAN
// =============================================================================

function pengaturan_get(PDO $pdo): array
{
    try {
        $stmt = $pdo->query("SELECT * FROM pengaturan LIMIT 1");
        return $stmt->fetch() ?: [];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function pengaturan_update(PDO $pdo, array $data): array
{
    safe_query($pdo,
        "UPDATE pengaturan SET
            nama_klinik=?, alamat_klinik=?, no_telepon_klinik=?,
            batas_diskon_karyawan=?, footer_invoice=?
         WHERE id=1",
        [
            $data['nama_klinik']           ?? '',
            $data['alamat_klinik']         ?? '',
            $data['no_telepon_klinik']     ?? '',
            (int)($data['batas_diskon_karyawan'] ?? 20),
            $data['footer_invoice']        ?? '',
        ]
    );
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
    try {
        $stmt = $pdo->prepare(
            "SELECT id, no_rekam_medis, nik, nama_lengkap, no_telepon, no_whatsapp
             FROM pasien WHERE nama_lengkap LIKE ? OR nik LIKE ?
             ORDER BY nama_lengkap ASC LIMIT 10"
        );
        $stmt->execute([$q, $q]);
        return ['data' => $stmt->fetchAll()];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function pasien_show(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    try {
        $stmt = $pdo->prepare("SELECT * FROM pasien WHERE id = ?");
        $stmt->execute([(int)$data['id']]);
        $pasien = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
    
    if (!$pasien) throw new BridgeException('Pasien tidak ditemukan', 404);
    return $pasien;
}

function pasien_store(PDO $pdo, array $data): array
{
    // 'nik' is no longer required – we'll generate it if missing
    require_fields($data, ['nama_lengkap', 'tanggal_lahir', 'jenis_kelamin']);

    // Determine NIK: use given value or generate a UUID
    $nik = isset($data['nik']) && trim($data['nik']) !== '' 
        ? trim($data['nik']) 
        : generate_uuid(); // implement UUID generation (see below)

    $no_rm = generate_no_rekam_medis($pdo);

    safe_query($pdo,
        "INSERT INTO pasien
            (no_rekam_medis, nik, nama_lengkap, tempat_lahir, tanggal_lahir,
             jenis_kelamin, alamat, no_telepon, no_whatsapp,
             golongan_darah, alergi, catatan_kulit)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            $no_rm,
            $nik,
            $data['nama_lengkap'],
            $data['tempat_lahir'] ?? '',
            $data['tanggal_lahir'],
            $data['jenis_kelamin'],
            $data['alamat'] ?? '',
            $data['no_telepon'] ?? '',
            $data['no_whatsapp'] ?? '',
            $data['golongan_darah'] ?? 'tidak_diketahui',
            $data['alergi'] ?? '',
            $data['catatan_kulit'] ?? '',
        ]
    );

    return ['id' => (int)$pdo->lastInsertId(), 'no_rekam_medis' => $no_rm];
}

/**
 * Generate a random version 4 UUID (RFC 4122)
 */
function generate_uuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function pasien_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'nama_lengkap']);
    safe_query($pdo,
        "UPDATE pasien SET
            nama_lengkap=?, tempat_lahir=?, tanggal_lahir=?, jenis_kelamin=?,
            alamat=?, no_telepon=?, no_whatsapp=?, golongan_darah=?,
            alergi=?, catatan_kulit=?
         WHERE id=?",
        [
            $data['nama_lengkap'], $data['tempat_lahir'] ?? '', $data['tanggal_lahir'] ?? null,
            $data['jenis_kelamin'] ?? 'L', $data['alamat'] ?? '', $data['no_telepon'] ?? '',
            $data['no_whatsapp'] ?? '', $data['golongan_darah'] ?? 'tidak_diketahui',
            $data['alergi'] ?? '', $data['catatan_kulit'] ?? '', (int)$data['id'],
        ]
    );
    return ['success' => true];
}

function pasien_riwayat(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien']);
    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

// =============================================================================
// PENDAFTARAN & ANTRIAN
// =============================================================================

function antrian_hari_ini(PDO $pdo, array $data): array
{
    $params    = [date('Y-m-d')];
    $sql       = "SELECT p.id, p.no_antrian, p.status, p.keluhan_utama, p.jenis_kunjungan,
                         p.tanggal, p.created_at,
                         p.id_paket_layanan as id_paket,
                         pas.id as id_pasien,
                         p.id as id_pendaftaran, p.id_dokter,
                         pas.nama_lengkap as nama_pasien, pas.no_rekam_medis,
                         pen.nama_lengkap as nama_dokter,
                         l.nama_layanan,
                         rm.id as id_rme, rm.status as status_rme,
                         pas.no_whatsapp as no_whatsapp,
                         pk.sisa_kunjungan, pk.total_kunjungan
                  FROM pendaftaran p
                  JOIN pasien pas ON pas.id = p.id_pasien
                  JOIN dokter d ON d.id = p.id_dokter
                  JOIN pengguna pen ON pen.id = d.id_pengguna
                  LEFT JOIN layanan l ON l.id = p.id_layanan
                  LEFT JOIN rekam_medis rm ON rm.id_pendaftaran = p.id
                  LEFT JOIN paket_kunjungan pk ON pk.id_pendaftaran = p.id
                  WHERE (p.tanggal = ?) OR (pk.sisa_kunjungan > 0 AND p.status = 'selesai')";
    
    if (!empty($data['filter_by_user'])) {
        $sql     .= " AND pen.id = ?";
        $params[] = (int)$data['filter_by_user'];
    }

    $sql .= " ORDER BY p.no_antrian ASC";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return ['data' => $stmt->fetchAll()];
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
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
    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
    
    if (!$row) throw new BridgeException('Pendaftaran tidak ditemukan', 404);
    return $row;
}

function pendaftaran_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien', 'id_dokter', 'id_layanan', 'id_karyawan',
                           'keluhan_utama', 'jenis_kunjungan']);
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // Cek kuota
    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Cek Kuota): ' . $e->getMessage());
    }

    if ($jadwal && (int)$jadwal['terisi'] >= (int)$jadwal['kuota']) {
        throw new BridgeException('Kuota dokter hari ini sudah penuh');
    }

    $no_antrian = generate_no_antrian($pdo, $tanggal);
    $id_paket = !empty($data['id_paket_layanan']) ? (int)$data['id_paket_layanan'] : null;
    $status = 'menunggu';

    $pdo->beginTransaction();
    try {
        safe_query($pdo,
            "INSERT INTO pendaftaran
                (no_antrian, id_pasien, id_dokter, id_layanan, id_paket_layanan, id_karyawan,
                 tanggal, keluhan_utama, jenis_kunjungan, status, catatan)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [
                $no_antrian, $data['id_pasien'], $data['id_dokter'],
                $data['id_layanan'], $id_paket, $data['id_karyawan'],
                $tanggal, $data['keluhan_utama'], $data['jenis_kunjungan'],
                $status, $data['catatan'] ?? '',
            ]
        );
        $id_pendaftaran = (int)$pdo->lastInsertId();

        if ($id_paket) {
            $stmt = $pdo->prepare("SELECT total_kunjungan FROM paket_layanan WHERE id = ?");
            $stmt->execute([$id_paket]);
            $tk = (int)$stmt->fetchColumn();

            safe_query($pdo,
                "INSERT INTO paket_kunjungan (id_pendaftaran, id_paket_layanan, total_kunjungan, sisa_kunjungan, status)
                 VALUES (?, ?, ?, ?, 'aktif')",
                [$id_pendaftaran, $id_paket, $tk, $tk]
            );
        }

        $pdo->commit();
        return ['id' => $id_pendaftaran, 'no_antrian' => $no_antrian];
    } catch (Exception $e) {
        $pdo->rollBack();
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
}

function pendaftaran_updateStatus(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'status']);
    $valid = ['menunggu','dipanggil','selesai','batal'];
    if (!in_array($data['status'], $valid)) {
        throw new BridgeException('Status tidak valid');
    }
    safe_query($pdo, "UPDATE pendaftaran SET status=? WHERE id=?", [$data['status'], (int)$data['id']]);
    return ['success' => true];
}

function pendaftaran_batal(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    $id = (int)$data['id'];

    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$row) throw new BridgeException('Pendaftaran tidak ditemukan', 404);

    if ($row['status'] === 'selesai') {
        throw new BridgeException('Pendaftaran sudah selesai dan tidak dapat dibatalkan');
    }
    if ($row['rme_status'] === 'final') {
        throw new BridgeException('RME sudah difinalisasi — pendaftaran tidak dapat dibatalkan');
    }

    $pdo->beginTransaction();
    try {
        safe_query($pdo, "UPDATE pendaftaran SET status='batal' WHERE id=?", [$id]);
        if ($row['rme_id'] && $row['rme_status'] === 'draft') {
            safe_query($pdo, "UPDATE rekam_medis SET status='batal' WHERE id=?", [(int)$row['rme_id']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw new BridgeException('DB Error (Batal Pendaftaran): ' . $e->getMessage());
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
    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$rme) throw new BridgeException('RME tidak ditemukan', 404);

    try {
        // Tindakan
        $stmt = $pdo->prepare(
            "SELECT tp.id, tp.harga_saat_itu, tp.keterangan, COALESCE(pl.nama_paket, l.nama_layanan) as nama_layanan
             FROM tindakan_pasien tp
             LEFT JOIN layanan l ON l.id = tp.id_layanan
             LEFT JOIN paket_layanan pl ON pl.id = tp.id_paket_layanan
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (RME Sub-query): ' . $e->getMessage());
    }

    return $rme;
}

function rme_latestByPatient(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien', 'id_rme']);
    
    try {
        // Get the latest RME for this patient
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
            WHERE rm.id_pasien = ?
            AND rm.id != ?
            ORDER BY rm.updated_at DESC
            LIMIT 1"
        );

        $stmt->execute([
            (int)$data['id_pasien'],
            (int)$data['id_rme']
        ]);
        $rme = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$rme) throw new BridgeException('RME tidak ditemukan', 404);

    try {
        // Tindakan
        $stmt = $pdo->prepare(
            "SELECT tp.id, tp.harga_saat_itu, tp.keterangan, l.nama_layanan
             FROM tindakan_pasien tp
             JOIN layanan l ON l.id = tp.id_layanan
             WHERE tp.id_rme = ?"
        );
        $stmt->execute([(int)$rme['id']]);
        $rme['tindakan'] = $stmt->fetchAll();

        // Resep + detail
        $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
        $stmt->execute([(int)$rme['id']]);
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (RME Sub-query): ' . $e->getMessage());
    }

    return $rme;
}

function rme_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pendaftaran', 'id_pasien', 'id_dokter']);
    
    try {
        // Cek tidak ada RME duplikat
        $stmt = $pdo->prepare("SELECT id FROM rekam_medis WHERE id_pendaftaran = ?");
        $stmt->execute([(int)$data['id_pendaftaran']]);
        if ($stmt->fetch()) throw new BridgeException('RME untuk pendaftaran ini sudah ada');
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    safe_query($pdo,
        "INSERT INTO rekam_medis
            (id_pendaftaran, id_pasien, id_dokter, subjektif, objektif,
             assesment, plan, kondisi_masuk, kondisi_keluar,
             instruksi_tindak_lanjut, id_diagnosa_utama, id_diagnosa_sekunder, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'draft')",
        [
            $data['id_pendaftaran'], $data['id_pasien'], $data['id_dokter'],
            $data['subjektif'] ?? '', $data['objektif'] ?? '', $data['assesment'] ?? '',
            $data['plan'] ?? '', $data['kondisi_masuk'] ?? '', $data['kondisi_keluar'] ?? '',
            $data['instruksi_tindak_lanjut'] ?? '', $data['id_diagnosa_utama'] ?? null,
            $data['id_diagnosa_sekunder'] ?? null,
        ]
    );
    return ['id' => (int)$pdo->lastInsertId()];
}

function rme_update(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    try {
        $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
        $stmt->execute([(int)$data['id']]);
        $row = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$row) throw new BridgeException('RME tidak ditemukan', 404);
    if ($row['status'] !== 'draft') throw new BridgeException('RME sudah final — tidak dapat diedit');

    safe_query($pdo,
        "UPDATE rekam_medis SET
            subjektif=?, objektif=?, assesment=?, plan=?,
            kondisi_masuk=?, kondisi_keluar=?, instruksi_tindak_lanjut=?,
            id_diagnosa_utama=?, id_diagnosa_sekunder=?
         WHERE id=?",
        [
            $data['subjektif'] ?? '', $data['objektif'] ?? '', $data['assesment'] ?? '',
            $data['plan'] ?? '', $data['kondisi_masuk'] ?? '', $data['kondisi_keluar'] ?? '',
            $data['instruksi_tindak_lanjut'] ?? '', $data['id_diagnosa_utama'] ?? null,
            $data['id_diagnosa_sekunder'] ?? null, (int)$data['id'],
        ]
    );
    return ['success' => true];
}

function rme_finalisasi(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_pendaftaran']);

    try {
        $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
        $stmt->execute([(int)$data['id']]);
        $rme = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$rme) throw new BridgeException('RME tidak ditemukan', 404);
    if ($rme['status'] !== 'draft') throw new BridgeException('RME tidak dalam status draft');

    $pdo->beginTransaction();
    try {
        safe_query($pdo, "UPDATE rekam_medis SET status='final' WHERE id=?", [(int)$data['id']]);
        safe_query($pdo, "UPDATE pendaftaran SET status='selesai' WHERE id=?", [(int)$data['id_pendaftaran']]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw new BridgeException('DB Error (Finalisasi): ' . $e->getMessage());
    }
    return ['success' => true];
}

function tindakan_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_rme']);

    // Auto migrate table if needed
    try {
        $pdo->exec("ALTER TABLE tindakan_pasien ADD COLUMN id_paket_layanan INT DEFAULT NULL");
    } catch (PDOException $e) {
        // column already exists, ignore
    }

    if (!empty($data['id_paket_layanan'])) {
        $stmt = $pdo->prepare("SELECT id_layanan, harga_total FROM paket_layanan WHERE id = ?");
        $stmt->execute([(int)$data['id_paket_layanan']]);
        $paket = $stmt->fetch();
        if (!$paket) throw new BridgeException('Paket layanan tidak ditemukan', 404);

        safe_query($pdo,
            "INSERT INTO tindakan_pasien (id_rme, id_layanan, id_paket_layanan, harga_saat_itu, keterangan)
             VALUES (?,?,?,?,?)",
            [$data['id_rme'], $paket['id_layanan'], $data['id_paket_layanan'], $paket['harga_total'], $data['keterangan'] ?? '']
        );
        $id_tindakan = (int)$pdo->lastInsertId();

        // [NEW] Otomatis menambah dari list produk paket_layanan ke resep obat
        try {
            $pdo->exec("ALTER TABLE detail_resep ADD COLUMN id_paket_layanan INT DEFAULT NULL");
        } catch (PDOException $e) { }

        $stmtResep = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
        $stmtResep->execute([(int)$data['id_rme']]);
        $resep = $stmtResep->fetch();
        if (!$resep) {
            safe_query($pdo, "INSERT INTO resep (id_rme, catatan) VALUES (?,?)", [$data['id_rme'], 'Otomatis dari Paket Layanan']);
            $id_resep = (int)$pdo->lastInsertId();
        } else {
            $id_resep = (int)$resep['id'];
        }

        $stmtProduk = $pdo->prepare(
            "SELECT pp.id_produk, pp.jumlah, pl.total_kunjungan 
             FROM paket_produk pp 
             JOIN paket_layanan pl ON pl.id = pp.id_paket_layanan 
             WHERE pp.id_paket_layanan = ?"
        );
        $stmtProduk->execute([(int)$data['id_paket_layanan']]);
        foreach ($stmtProduk->fetchAll() as $pp) {
            $jml_per_visit = max(1, (int)ceil($pp['jumlah'] / max(1, (int)$pp['total_kunjungan'])));
            safe_query($pdo,
                "INSERT INTO detail_resep (id_resep, id_produk, jumlah, dosis, aturan_pakai, keterangan, id_paket_layanan)
                 VALUES (?,?,?,?,?,?,?)",
                [$id_resep, $pp['id_produk'], $jml_per_visit, '', 'Sesuai Paket', 'Dari paket layanan', (int)$data['id_paket_layanan']]
            );
        }

        return ['id' => $id_tindakan];
    } else {
        require_fields($data, ['id_layanan']);
        $stmt = $pdo->prepare("SELECT harga FROM layanan WHERE id = ?");
        $stmt->execute([(int)$data['id_layanan']]);
        $layanan = $stmt->fetch();
        if (!$layanan) throw new BridgeException('Layanan tidak ditemukan', 404);

        safe_query($pdo,
            "INSERT INTO tindakan_pasien (id_rme, id_layanan, harga_saat_itu, keterangan)
             VALUES (?,?,?,?)",
            [$data['id_rme'], $data['id_layanan'], $layanan['harga'], $data['keterangan'] ?? '']
        );
        return ['id' => (int)$pdo->lastInsertId()];
    }
}

function tindakan_delete(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'id_rme']);
    try {
        $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
        $stmt->execute([(int)$data['id_rme']]);
        $rme = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$rme || $rme['status'] !== 'draft') {
        throw new BridgeException('Tidak dapat menghapus tindakan — RME sudah final');
    }

    $stmt = $pdo->prepare("SELECT id_paket_layanan FROM tindakan_pasien WHERE id = ?");
    $stmt->execute([(int)$data['id']]);
    $id_paket = $stmt->fetchColumn();

    if ($id_paket) {
        $stmtResep = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
        $stmtResep->execute([(int)$data['id_rme']]);
        $resep = $stmtResep->fetch();
        if ($resep) {
            try {
                $pdo->exec("ALTER TABLE detail_resep ADD COLUMN id_paket_layanan INT DEFAULT NULL");
            } catch (PDOException $e) { }
            safe_query($pdo, "DELETE FROM detail_resep WHERE id_resep = ? AND id_paket_layanan = ?", [$resep['id'], $id_paket]);
        }
    }

    safe_query($pdo, "DELETE FROM tindakan_pasien WHERE id=? AND id_rme=?", [(int)$data['id'], (int)$data['id_rme']]);
    return ['success' => true];
}
// =============================================================================
// RESEP — GET BY RME
// =============================================================================

/**
 * Get all obat (produk) items in the resep tied to a given RME.
 * Action: "resep.getByRme"
 * Expects: id_rme
 * Returns: [ { nama_obat, nama_produk, qty, satuan, dosis }, ... ]  (plain array, no wrapper)
 */
function resep_getByRme(PDO $pdo, array $data): array
{
    require_fields($data, ['id_rme']);

    try {
        // Cari resep untuk RME ini
        $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
        $stmt->execute([(int)$data['id_rme']]);
        $resep = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$resep) {
        // Tidak ada resep untuk RME ini — kembalikan array kosong
        return [];
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT pr.nama_produk as nama_obat,
                    pr.nama_produk,
                    dr.jumlah as qty,
                    pr.satuan,
                    dr.dosis
             FROM detail_resep dr
             JOIN produk pr ON pr.id = dr.id_produk
             WHERE dr.id_resep = ?
             ORDER BY pr.nama_produk ASC"
        );
        $stmt->execute([(int)$resep['id']]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Resep Items): ' . $e->getMessage());
    }
}

function resep_storeItem(PDO $pdo, array $data): array
{
    require_fields($data, ['id_rme', 'id_produk', 'jumlah']);

    try {
        // Buat tabel resep jika belum ada untuk RME ini
        $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
        $stmt->execute([(int)$data['id_rme']]);
        $resep = $stmt->fetch();
        
        if (!$resep) {
            safe_query($pdo, "INSERT INTO resep (id_rme, catatan) VALUES (?,?)", [$data['id_rme'], $data['catatan_resep'] ?? '']);
            $id_resep = (int)$pdo->lastInsertId();
        } else {
            $id_resep = (int)$resep['id'];
        }

        // Cek stok (warning saja — tidak blocking)
        $stmt = $pdo->prepare("SELECT stok, nama_produk FROM produk WHERE id = ?");
        $stmt->execute([(int)$data['id_produk']]);
        $produk = $stmt->fetch();
        $stok_warning = $produk && $produk['stok'] < (int)$data['jumlah'];

    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    safe_query($pdo,
        "INSERT INTO detail_resep (id_resep, id_produk, jumlah, dosis, aturan_pakai, keterangan)
         VALUES (?,?,?,?,?,?)",
        [$id_resep, $data['id_produk'], $data['jumlah'], $data['dosis'] ?? '', $data['aturan_pakai'] ?? '', $data['keterangan'] ?? '']
    );

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
    try {
        $stmt = $pdo->prepare("SELECT status FROM rekam_medis WHERE id = ?");
        $stmt->execute([(int)$data['id_rme']]);
        $rme = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$rme || $rme['status'] !== 'draft') {
        throw new BridgeException('Tidak dapat menghapus item resep — RME sudah final');
    }
    safe_query($pdo, "DELETE FROM detail_resep WHERE id=?", [(int)$data['id']]);
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
    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);

    try {
        // Detail items
        $stmt = $pdo->prepare("SELECT * FROM detail_invoice WHERE id_invoice = ? ORDER BY jenis, id ASC");
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Sub-query Invoice): ' . $e->getMessage());
    }

    return $inv;
}

function invoice_generate(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pendaftaran', 'id_karyawan']);
    $id_pendaftaran = (int)$data['id_pendaftaran'];

    try {
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
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Generate Check): ' . $e->getMessage());
    }

    if (!$pend) throw new BridgeException('Pendaftaran tidak ditemukan atau belum selesai', 404);

    $items    = [];
    $subtotal = 0;

    try {
        // Item 2+: Tindakan dari RME
        if ($pend['id_rme']) {
            $stmt = $pdo->prepare(
                "SELECT tp.id, tp.harga_saat_itu, COALESCE(pl.nama_paket, l.nama_layanan) as nama_layanan, tp.keterangan
                 FROM tindakan_pasien tp
                 LEFT JOIN layanan l ON l.id = tp.id_layanan
                 LEFT JOIN paket_layanan pl ON pl.id = tp.id_paket_layanan
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
                try {
                    $pdo->exec("ALTER TABLE detail_resep ADD COLUMN id_paket_layanan INT DEFAULT NULL");
                } catch (PDOException $e) { }
                $stmt = $pdo->prepare(
                    "SELECT dr.id, dr.jumlah, pr.nama_produk, pr.harga_jual, dr.id_paket_layanan
                     FROM detail_resep dr
                     JOIN produk pr ON pr.id = dr.id_produk
                     WHERE dr.id_resep = ?"
                );
                $stmt->execute([(int)$resep['id']]);
                foreach ($stmt->fetchAll() as $r) {
                    $is_paket = !empty($r['id_paket_layanan']);
                    $sub     = $is_paket ? 0 : ((float)$r['harga_jual'] * (int)$r['jumlah']);
                    $items[] = [
                        'jenis'        => 'produk',
                        'id_referensi' => (int)$r['id'],
                        'nama_item'    => $r['nama_produk'] . ($is_paket ? ' (Termasuk Paket)' : ''),
                        'qty'          => (int)$r['jumlah'],
                        'harga_satuan' => $is_paket ? 0 : (float)$r['harga_jual'],
                        'subtotal'     => $sub,
                    ];
                    $subtotal += $sub;
                }
            }
        }
    } catch (PDOException $e) {
        throw new BridgeException('DB Error (Generate Items): ' . $e->getMessage());
    }

    $no_invoice = generate_no_invoice($pdo);

    $pdo->beginTransaction();
    try {
        safe_query($pdo,
            "INSERT INTO invoice
                (no_invoice, id_pendaftaran, id_karyawan, subtotal, diskon, total, total_dibayar, status)
             VALUES (?,?,?,?,0,?,0,'belum_bayar')",
            [$no_invoice, $id_pendaftaran, $data['id_karyawan'], $subtotal, $subtotal]
        );
        $id_invoice = (int)$pdo->lastInsertId();

        foreach ($items as $item) {
            safe_query($pdo,
                "INSERT INTO detail_invoice
                    (id_invoice, jenis, id_referensi, nama_item, qty, harga_satuan, subtotal)
                 VALUES (?,?,?,?,?,?,?)",
                [$id_invoice, $item['jenis'], $item['id_referensi'], $item['nama_item'], $item['qty'], $item['harga_satuan'], $item['subtotal']]
            );
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw new BridgeException('DB Error (Generate Insert): ' . $e->getMessage());
    }

    return ['id' => $id_invoice, 'no_invoice' => $no_invoice, 'subtotal' => $subtotal];
}

function invoice_applyDiskon(PDO $pdo, array $data): array
{
    require_fields($data, ['id', 'diskon']);
    $id    = (int)$data['id'];
    $diskon = (float)$data['diskon'];

    try {
        $stmt = $pdo->prepare("SELECT subtotal, status FROM invoice WHERE id=?");
        $stmt->execute([$id]);
        $inv = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);
    if ($inv['status'] !== 'belum_bayar') throw new BridgeException('Diskon hanya bisa diberikan pada invoice belum bayar');
    if ($diskon < 0 || $diskon > (float)$inv['subtotal']) throw new BridgeException('Diskon tidak valid');

    $total = (float)$inv['subtotal'] - $diskon;
    safe_query($pdo, "UPDATE invoice SET diskon=?, total=? WHERE id=?", [$diskon, $total, $id]);
    return ['success' => true, 'total' => $total];
}

function invoice_batal(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    try {
        $stmt = $pdo->prepare("SELECT status FROM invoice WHERE id=?");
        $stmt->execute([(int)$data['id']]);
        $inv = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);
    if ($inv['status'] !== 'belum_bayar') {
        throw new BridgeException('Hanya invoice belum_bayar yang dapat dibatalkan');
    }
    
    try {
        // Cek apakah sudah ada pembayaran masuk
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(nominal),0) as total FROM pembayaran WHERE id_invoice=?");
        $stmt->execute([(int)$data['id']]);
        if ((float)$stmt->fetchColumn() > 0) {
            throw new BridgeException('Invoice sudah memiliki riwayat pembayaran');
        }
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    safe_query($pdo, "UPDATE invoice SET status='batal' WHERE id=?", [(int)$data['id']]);
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

    try {
        $stmt = $pdo->prepare("SELECT total, total_dibayar, status FROM invoice WHERE id=?");
        $stmt->execute([$id_invoice]);
        $inv = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$inv) throw new BridgeException('Invoice tidak ditemukan', 404);
    if ($inv['status'] === 'lunas') throw new BridgeException('Invoice sudah lunas');
    if ($inv['status'] === 'batal') throw new BridgeException('Invoice sudah dibatalkan');

    $sisa = (float)$inv['total'] - (float)$inv['total_dibayar'];

    if ($metode === 'tunai') {
        $kembalian = max(0, $nominal - $sisa);
    } else {
        if ($nominal > $sisa) {
            throw new BridgeException('Nominal melebihi sisa tagihan (' . number_format($sisa, 0, ',', '.') . ')');
        }
    }

    $efektif      = $nominal - $kembalian;
    $total_dibayar = (float)$inv['total_dibayar'] + $efektif;

    $pdo->beginTransaction();
    try {
        safe_query($pdo,
            "INSERT INTO pembayaran (id_invoice, id_karyawan, metode, nominal, kembalian, waktu_bayar)
             VALUES (?,?,?,?,?,NOW())",
            [$id_invoice, $data['id_karyawan'], $metode, $nominal, $kembalian]
        );

        safe_query($pdo, "UPDATE invoice SET total_dibayar=? WHERE id=?", [$total_dibayar, $id_invoice]);

        // Cek apakah sudah lunas
        $lunas = $total_dibayar >= (float)$inv['total'];
        if ($lunas) {
            safe_query($pdo, "UPDATE invoice SET status='lunas' WHERE id=?", [$id_invoice]);
            
            // Deduct stok produk
            try {
                $stmt = $pdo->prepare(
                    "SELECT di.id_referensi, di.qty
                     FROM detail_invoice di
                     WHERE di.id_invoice = ? AND di.jenis = 'produk'"
                );
                $stmt->execute([$id_invoice]);
                $produk_items = $stmt->fetchAll();
            } catch (PDOException $e) {
                throw new BridgeException('DB Error (Fetch Produk Items): ' . $e->getMessage());
            }

            foreach ($produk_items as $pi) {
                try {
                    $stmt2 = $pdo->prepare("SELECT id_produk FROM detail_resep WHERE id=?");
                    $stmt2->execute([(int)$pi['id_referensi']]);
                    $dr = $stmt2->fetch();
                } catch (PDOException $e) {
                    throw new BridgeException('DB Error (Fetch Resep): ' . $e->getMessage());
                }

                if ($dr) {
                    safe_query($pdo, "UPDATE produk SET stok = GREATEST(0, stok - ?) WHERE id=?", [(int)$pi['qty'], (int)$dr['id_produk']]);
                }
            }

            // Deduct stok produk dari paket (jika ada) - Kunjungan Pertama
            try {
                $stmt3 = $pdo->prepare("SELECT id_pendaftaran FROM invoice WHERE id=?");
                $stmt3->execute([$id_invoice]);
                $id_pend = $stmt3->fetchColumn();

                if ($id_pend) {
                    // Cek paket dari pendaftaran
                    $stmt4 = $pdo->prepare("SELECT id_paket_layanan FROM pendaftaran WHERE id=?");
                    $stmt4->execute([$id_pend]);
                    $id_paket = $stmt4->fetchColumn();

                    if ($id_paket) {
                        $stmt5 = $pdo->prepare("SELECT id_produk, jumlah FROM paket_produk WHERE id_paket_layanan = ?");
                        $stmt5->execute([$id_paket]);
                        foreach ($stmt5->fetchAll() as $pp) {
                            safe_query($pdo, "UPDATE produk SET stok = GREATEST(0, stok - ?) WHERE id=?", 
                                [(int)$pp['jumlah'], (int)$pp['id_produk']]);
                        }
                    }
                }
            } catch (PDOException $e) {
                throw new BridgeException('DB Error (Fetch Paket Produk): ' . $e->getMessage());
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw new BridgeException('DB Error (Pembayaran): ' . $e->getMessage());
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
                    pas.nama_lengkap as nama_pasien, fw.no_whatsapp, fw.jenis as jenis_followup, fw.pesan, fw.updated_at as tanggal_kirim 
             FROM followup_wa fw
             JOIN pasien pas ON pas.id = fw.id_pasien
             ORDER BY fw.created_at DESC";
    return paginate($pdo, $sql, [], $page);
}

function followup_store(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pasien', 'id_pengguna', 'no_whatsapp', 'pesan', 'wa_link', 'jenis']);
    safe_query($pdo,
        "INSERT INTO followup_wa
            (id_pasien, id_pengguna, no_whatsapp, pesan, wa_link, jenis, status)
         VALUES (?,?,?,?,?,?,'draft')",
        [$data['id_pasien'], $data['id_pengguna'], $data['no_whatsapp'], $data['pesan'], $data['wa_link'], $data['jenis']]
    );
    return ['id' => (int)$pdo->lastInsertId()];
}

function followup_tandaiTerkirim(PDO $pdo, array $data): array
{
    require_fields($data, ['id']);
    safe_query($pdo, "UPDATE followup_wa SET status='terkirim' WHERE id=?", [(int)$data['id']]);
    return ['success' => true];
}

// =============================================================================
// LAPORAN
// =============================================================================

function laporan_harian(PDO $pdo, array $data): array
{
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // ── Total pendapatan & invoice ──
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(total),0) as total_pendapatan,
                COUNT(*) as total_invoice
         FROM invoice
         WHERE DATE(created_at) = ? AND status = 'lunas'"
    );
    $stmt->execute([$tanggal]);
    $keuangan = $stmt->fetch();

    // ── Breakdown per metode bayar ──
    $stmt = $pdo->prepare(
        "SELECT pb.metode, COALESCE(SUM(pb.nominal - pb.kembalian),0) as total
         FROM pembayaran pb
         JOIN invoice i ON i.id = pb.id_invoice
         WHERE DATE(pb.waktu_bayar) = ? AND i.status = 'lunas'
         GROUP BY pb.metode"
    );
    $stmt->execute([$tanggal]);
    $per_metode = $stmt->fetchAll();

    // ── Total pasien dengan breakdown status ──
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN jenis_kunjungan='baru' THEN 1 ELSE 0 END) as pasien_baru,
                SUM(CASE WHEN jenis_kunjungan!='baru' THEN 1 ELSE 0 END) as pasien_lama,
                SUM(CASE WHEN status='selesai' THEN 1 ELSE 0 END) as selesai,
                SUM(CASE WHEN status='batal' THEN 1 ELSE 0 END) as batal,
                SUM(CASE WHEN status IN ('menunggu','dipanggil') THEN 1 ELSE 0 END) as antrian
         FROM pendaftaran
         WHERE tanggal = ?"
    );
    $stmt->execute([$tanggal]);
    $pasien = $stmt->fetch();

    // ── Breakdown per kategori layanan ──
    $stmt = $pdo->prepare(
        "SELECT l.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                COUNT(*) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN layanan l ON l.id = di.id_referensi
         WHERE di.jenis = 'layanan'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY l.kategori"
    );
    $stmt->execute([$tanggal]);
    $per_kategori_layanan = $stmt->fetchAll();

    // ── Breakdown per kategori produk ──
    $stmt = $pdo->prepare(
        "SELECT pr.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                SUM(di.qty) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN produk pr ON pr.id = di.id_referensi
         WHERE di.jenis = 'produk'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY pr.kategori"
    );
    $stmt->execute([$tanggal]);
    $per_kategori_produk = $stmt->fetchAll();

    // ── Top 5 layanan by revenue ──
    $stmt = $pdo->prepare(
        "SELECT l.nama_layanan as nama,
                COUNT(*) as jumlah,
                COALESCE(SUM(di.subtotal),0) as total
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN layanan l ON l.id = di.id_referensi
         WHERE di.jenis = 'layanan'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY l.id, l.nama_layanan
         ORDER BY total DESC
         LIMIT 5"
    );
    $stmt->execute([$tanggal]);
    $top_layanan = $stmt->fetchAll();

    // ── Top 5 produk by revenue ──
    $stmt = $pdo->prepare(
        "SELECT pr.nama_produk as nama,
                SUM(di.qty) as jumlah,
                COALESCE(SUM(di.subtotal),0) as total
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN produk pr ON pr.id = di.id_referensi
         WHERE di.jenis = 'produk'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY pr.id, pr.nama_produk
         ORDER BY total DESC
         LIMIT 5"
    );
    $stmt->execute([$tanggal]);
    $top_produk = $stmt->fetchAll();

    // ── Performa dokter ──
    $stmt = $pdo->prepare(
        "SELECT pg.nama_lengkap as nama_dokter,
                COUNT(DISTINCT p.id) as jumlah_pasien,
                COALESCE(SUM(i.total),0) as total_pendapatan
         FROM pendaftaran p
         JOIN dokter d ON d.id = p.id_dokter
         JOIN pengguna pg ON pg.id = d.id_pengguna
         LEFT JOIN invoice i ON i.id_pendaftaran = p.id AND i.status = 'lunas'
         WHERE p.tanggal = ?
           AND p.status != 'batal'
         GROUP BY d.id, pg.nama_lengkap
         ORDER BY total_pendapatan DESC"
    );
    $stmt->execute([$tanggal]);
    $per_dokter = $stmt->fetchAll();

    // ── RME stats ──
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status='final' THEN 1 ELSE 0 END) as final,
                SUM(CASE WHEN status='batal' THEN 1 ELSE 0 END) as batal
         FROM rekam_medis
         WHERE DATE(created_at) = ?"
    );
    $stmt->execute([$tanggal]);
    $rme_stats = $stmt->fetch();

    // ── Daftar invoice hari ini ──
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
        'tanggal'              => $tanggal,
        'total_pendapatan'     => (float)$keuangan['total_pendapatan'],
        'total_invoice'        => (int)$keuangan['total_invoice'],
        'per_metode'           => $per_metode,
        'total_pasien'        => (int)$pasien['total'],
        'pasien_baru'         => (int)$pasien['pasien_baru'],
        'pasien_lama'         => (int)$pasien['pasien_lama'],
        'selesai'             => (int)$pasien['selesai'],
        'batal'               => (int)$pasien['batal'],
        'antrian'             => (int)$pasien['antrian'],
        'per_kategori_layanan' => $per_kategori_layanan,
        'per_kategori_produk'  => $per_kategori_produk,
        'top_layanan'         => $top_layanan,
        'top_produk'          => $top_produk,
        'per_dokter'          => $per_dokter,
        'rme_stats'           => [
            'total' => (int)$rme_stats['total'],
            'draft' => (int)$rme_stats['draft'],
            'final' => (int)$rme_stats['final'],
        ],
        'invoices'            => $invoice_list,
    ];
}

function laporan_bulanan(PDO $pdo, array $data): array
{
    $bulan  = $data['bulan']  ?? date('m');
    $tahun  = $data['tahun']  ?? date('Y');
    $bulan  = str_pad((string)$bulan, 2, '0', STR_PAD_LEFT);
    $prefix = "{$tahun}-{$bulan}";
    
    // ── Total pendapatan & invoice ──
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(total),0) as total_pendapatan,
                COUNT(*) as total_invoice
         FROM invoice
         WHERE DATE_FORMAT(created_at,'%Y-%m') = ? AND status = 'lunas'"
    );
    $stmt->execute([$prefix]);
    $keuangan = $stmt->fetch();

    // ── Breakdown per metode bayar ──
    $stmt = $pdo->prepare(
        "SELECT pb.metode, COALESCE(SUM(pb.nominal - pb.kembalian),0) as total
         FROM pembayaran pb
         JOIN invoice i ON i.id = pb.id_invoice
         WHERE DATE_FORMAT(pb.waktu_bayar,'%Y-%m') = ? AND i.status = 'lunas'
         GROUP BY pb.metode"
    );
    $stmt->execute([$prefix]);
    $per_metode = $stmt->fetchAll();

    // ── Total pasien ──
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN jenis_kunjungan='baru' THEN 1 ELSE 0 END) as pasien_baru,
                SUM(CASE WHEN jenis_kunjungan!='baru' THEN 1 ELSE 0 END) as pasien_lama
         FROM pendaftaran
         WHERE DATE_FORMAT(tanggal,'%Y-%m') = ? AND status != 'batal'"
    );
    $stmt->execute([$prefix]);
    $pasien = $stmt->fetch();

    // ── Breakdown per kategori layanan ──
    $stmt = $pdo->prepare(
        "SELECT l.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                COUNT(*) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN layanan l ON l.id = di.id_referensi
         WHERE di.jenis = 'layanan'
           AND DATE_FORMAT(i.created_at,'%Y-%m') = ?
           AND i.status = 'lunas'
         GROUP BY l.kategori"
    );
    $stmt->execute([$prefix]);
    $per_kategori_layanan = $stmt->fetchAll();

    // ── Breakdown per kategori produk ──
    $stmt = $pdo->prepare(
        "SELECT pr.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                SUM(di.qty) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN produk pr ON pr.id = di.id_referensi
         WHERE di.jenis = 'produk'
           AND DATE_FORMAT(i.created_at,'%Y-%m') = ?
           AND i.status = 'lunas'
         GROUP BY pr.kategori"
    );
    $stmt->execute([$prefix]);
    $per_kategori_produk = $stmt->fetchAll();

    // ── Performa dokter ──
    $stmt = $pdo->prepare(
        "SELECT pg.nama_lengkap as nama_dokter,
                COUNT(DISTINCT p.id) as jumlah_pasien,
                COALESCE(SUM(i.total),0) as total_pendapatan
         FROM pendaftaran p
         JOIN dokter d ON d.id = p.id_dokter
         JOIN pengguna pg ON pg.id = d.id_pengguna
         LEFT JOIN invoice i ON i.id_pendaftaran = p.id AND i.status = 'lunas'
         WHERE DATE_FORMAT(p.tanggal,'%Y-%m') = ?
           AND p.status != 'batal'
         GROUP BY d.id, pg.nama_lengkap
         ORDER BY total_pendapatan DESC"
    );
    $stmt->execute([$prefix]);
    $per_dokter = $stmt->fetchAll();

    // ── RME stats ──
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status='final' THEN 1 ELSE 0 END) as final,
                SUM(CASE WHEN status='batal' THEN 1 ELSE 0 END) as batal
         FROM rekam_medis
         WHERE DATE_FORMAT(created_at,'%Y-%m') = ?"
    );
    $stmt->execute([$prefix]);
    $rme_stats = $stmt->fetch();

    // ── Ringkasan per hari ──
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
        'bulan'                => (int)$bulan,
        'tahun'               => (int)$tahun,
        'total_pendapatan'    => (float)$keuangan['total_pendapatan'],
        'total_invoice'       => (int)$keuangan['total_invoice'],
        'per_metode'          => $per_metode,
        'total_pasien'        => (int)$pasien['total'],
        'pasien_baru'         => (int)$pasien['pasien_baru'],
        'pasien_lama'         => (int)$pasien['pasien_lama'],
        'per_kategori_layanan' => $per_kategori_layanan,
        'per_kategori_produk'  => $per_kategori_produk,
        'per_dokter'          => $per_dokter,
        'rme_stats'           => [
            'total' => (int)$rme_stats['total'],
            'draft' => (int)$rme_stats['draft'],
            'final' => (int)$rme_stats['final'],
        ],
        'per_hari'            => $per_hari,
    ];
}

// ─── Laporan Layanan (Service Category) ─────────────────────────────────────────
function laporan_layanan(PDO $pdo, array $data): array
{
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // ── Breakdown per kategori layanan ──
    $stmt = $pdo->prepare(
        "SELECT l.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                COUNT(*) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN layanan l ON l.id = di.id_referensi
         WHERE di.jenis = 'layanan'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY l.kategori"
    );
    $stmt->execute([$tanggal]);
    $per_kategori = $stmt->fetchAll();

    // ── Top layanan ──
    $stmt = $pdo->prepare(
        "SELECT l.nama_layanan as nama,
                l.kategori,
                COUNT(*) as jumlah,
                COALESCE(SUM(di.subtotal),0) as total
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN layanan l ON l.id = di.id_referensi
         WHERE di.jenis = 'layanan'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY l.id, l.nama_layanan, l.kategori
         ORDER BY total DESC"
    );
    $stmt->execute([$tanggal]);
    $top_layanan = $stmt->fetchAll();

    // Total pendapatan layanan
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(di.subtotal),0) as total
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         WHERE di.jenis = 'layanan'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'"
    );
    $stmt->execute([$tanggal]);
    $total_pendapatan = (float)$stmt->fetch()['total'];

    return [
        'tanggal'        => $tanggal,
        'per_kategori'   => $per_kategori,
        'top_layanan'    => $top_layanan,
        'total_pendapatan' => $total_pendapatan,
    ];
}

// ─── Laporan Produk ─────────────────────────────────────────────────────────────
function laporan_produk(PDO $pdo, array $data): array
{
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // ── Breakdown per kategori produk ──
    $stmt = $pdo->prepare(
        "SELECT pr.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                SUM(di.qty) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN produk pr ON pr.id = di.id_referensi
         WHERE di.jenis = 'produk'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY pr.kategori"
    );
    $stmt->execute([$tanggal]);
    $per_kategori = $stmt->fetchAll();

    // ── Top produk ──
    $stmt = $pdo->prepare(
        "SELECT pr.nama_produk as nama,
                pr.kategori,
                SUM(di.qty) as jumlah,
                COALESCE(SUM(di.subtotal),0) as total
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN produk pr ON pr.id = di.id_referensi
         WHERE di.jenis = 'produk'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'
         GROUP BY pr.id, pr.nama_produk, pr.kategori
         ORDER BY total DESC"
    );
    $stmt->execute([$tanggal]);
    $top_produk = $stmt->fetchAll();

    // Total pendapatan produk
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(di.subtotal),0) as total
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         WHERE di.jenis = 'produk'
           AND DATE(i.created_at) = ?
           AND i.status = 'lunas'"
    );
    $stmt->execute([$tanggal]);
    $total_pendapatan = (float)$stmt->fetch()['total'];

    return [
        'tanggal'        => $tanggal,
        'per_kategori'   => $per_kategori,
        'top_produk'     => $top_produk,
        'total_pendapatan' => $total_pendapatan,
    ];
}

// ─── Laporan Dokter ───────────────────────────────────────────────────────────
function laporan_dokter(PDO $pdo, array $data): array
{
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // ── Performa dokter ──
    $stmt = $pdo->prepare(
        "SELECT pg.nama_lengkap as nama_dokter,
                COUNT(DISTINCT p.id) as jumlah_pasien,
                COALESCE(SUM(i.total),0) as total_pendapatan
         FROM pendaftaran p
         JOIN dokter d ON d.id = p.id_dokter
         JOIN pengguna pg ON pg.id = d.id_pengguna
         LEFT JOIN invoice i ON i.id_pendaftaran = p.id AND i.status = 'lunas'
         WHERE p.tanggal = ?
           AND p.status != 'batal'
         GROUP BY d.id, pg.nama_lengkap
         ORDER BY total_pendapatan DESC"
    );
    $stmt->execute([$tanggal]);
    $per_dokter = $stmt->fetchAll();

    // Calculate average and format
    $formatted_dokter = array_map(function($d) {
        $d['rata_rata'] = $d['jumlah_pasien'] > 0
            ? round((float)$d['total_pendapatan'] / (int)$d['jumlah_pasien'], 0)
            : 0;
        $d['total_pendapatan'] = (float)$d['total_pendapatan'];
        $d['jumlah_pasien'] = (int)$d['jumlah_pasien'];
        return $d;
    }, $per_dokter);

    // Total
    $total_pasien = array_reduce($formatted_dokter, fn($sum, $d) => $sum + $d['jumlah_pasien'], 0);
    $total_pendapatan = array_reduce($formatted_dokter, fn($sum, $d) => $sum + $d['total_pendapatan'], 0.0);

    return [
        'tanggal'           => $tanggal,
        'per_dokter'        => $formatted_dokter,
        'total_pasien'      => $total_pasien,
        'total_pendapatan'  => $total_pendapatan,
    ];
}

// ─── Laporan RME ───────────────────────────────────────────────────────────────
function laporan_rme(PDO $pdo, array $data): array
{
    $tanggal = $data['tanggal'] ?? date('Y-m-d');

    // ── Stats by status ──
    $stmt = $pdo->prepare(
        "SELECT status,
                COUNT(*) as jumlah
         FROM rekam_medis
         WHERE DATE(created_at) = ?
         GROUP BY status"
    );
    $stmt->execute([$tanggal]);
    $per_status = $stmt->fetchAll();

    // ── Stats by dokter ──
    $stmt = $pdo->prepare(
        "SELECT pg.nama_lengkap as nama_dokter,
                COUNT(*) as jumlah
         FROM rekam_medis rm
         JOIN dokter d ON d.id = rm.id_dokter
         JOIN pengguna pg ON pg.id = d.id_pengguna
         WHERE DATE(rm.created_at) = ?
         GROUP BY d.id, pg.nama_lengkap
         ORDER BY jumlah DESC"
    );
    $stmt->execute([$tanggal]);
    $per_dokter = $stmt->fetchAll();

    // Total
    $total = array_reduce($per_status, fn($sum, $s) => $sum + (int)$s['jumlah'], 0);

    return [
        'tanggal'    => $tanggal,
        'total'      => $total,
        'per_status' => array_map(fn($s) => [
            'status' => $s['status'],
            'jumlah' => (int)$s['jumlah'],
        ], $per_status),
        'per_dokter' => array_map(fn($d) => [
            'nama_dokter' => $d['nama_dokter'],
            'jumlah' => (int)$d['jumlah'],
        ], $per_dokter),
    ];
}

// ─── Laporan Custom Range ──────────────────────────────────────────────────────
function laporan_range(PDO $pdo, array $data): array
{
    $tanggal_mulai = $data['tanggal_mulai'] ?? date('Y-m-d');
    $tanggal_selesai = $data['tanggal_selesai'] ?? date('Y-m-d');

    // ── Total pendapatan & invoice ──
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(total),0) as total_pendapatan,
                COUNT(*) as total_invoice
         FROM invoice
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'lunas'"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $keuangan = $stmt->fetch();

    // ── Breakdown per metode bayar ──
    $stmt = $pdo->prepare(
        "SELECT pb.metode, COALESCE(SUM(pb.nominal - pb.kembalian),0) as total
         FROM pembayaran pb
         JOIN invoice i ON i.id = pb.id_invoice
         WHERE DATE(pb.waktu_bayar) BETWEEN ? AND ? AND i.status = 'lunas'
         GROUP BY pb.metode"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $per_metode = $stmt->fetchAll();

    // ── Total pasien ──
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) as total,
                SUM(CASE WHEN jenis_kunjungan='baru' THEN 1 ELSE 0 END) as pasien_baru,
                SUM(CASE WHEN jenis_kunjungan!='baru' THEN 1 ELSE 0 END) as pasien_lama
         FROM pendaftaran
         WHERE DATE(tanggal) BETWEEN ? AND ? AND status != 'batal'"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $pasien = $stmt->fetch();

    // ── Breakdown per kategori layanan ──
    $stmt = $pdo->prepare(
        "SELECT l.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                COUNT(*) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN layanan l ON l.id = di.id_referensi
         WHERE di.jenis = 'layanan'
           AND DATE(i.created_at) BETWEEN ? AND ?
           AND i.status = 'lunas'
         GROUP BY l.kategori"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $per_kategori_layanan = $stmt->fetchAll();

    // ── Breakdown per kategori produk ──
    $stmt = $pdo->prepare(
        "SELECT pr.kategori,
                COALESCE(SUM(di.subtotal),0) as total,
                SUM(di.qty) as jumlah
         FROM detail_invoice di
         JOIN invoice i ON i.id = di.id_invoice
         JOIN produk pr ON pr.id = di.id_referensi
         WHERE di.jenis = 'produk'
           AND DATE(i.created_at) BETWEEN ? AND ?
           AND i.status = 'lunas'
         GROUP BY pr.kategori"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $per_kategori_produk = $stmt->fetchAll();

    // ── Performa dokter ──
    $stmt = $pdo->prepare(
        "SELECT pg.nama_lengkap as nama_dokter,
                COUNT(DISTINCT p.id) as jumlah_pasien,
                COALESCE(SUM(i.total),0) as total_pendapatan
         FROM pendaftaran p
         JOIN dokter d ON d.id = p.id_dokter
         JOIN pengguna pg ON pg.id = d.id_pengguna
         LEFT JOIN invoice i ON i.id_pendaftaran = p.id AND i.status = 'lunas'
         WHERE DATE(p.tanggal) BETWEEN ? AND ?
           AND p.status != 'batal'
         GROUP BY d.id, pg.nama_lengkap
         ORDER BY total_pendapatan DESC"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $per_dokter = $stmt->fetchAll();

    // ── Per hari ──
    $stmt = $pdo->prepare(
        "SELECT DATE(created_at) as hari,
                COUNT(*) as jumlah_invoice,
                SUM(total) as pendapatan
         FROM invoice
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'lunas'
         GROUP BY DATE(created_at)
         ORDER BY hari ASC"
    );
    $stmt->execute([$tanggal_mulai, $tanggal_selesai]);
    $per_hari = $stmt->fetchAll();

    return [
        'tanggal_mulai'        => $tanggal_mulai,
        'tanggal_selesai'     => $tanggal_selesai,
        'total_pendapatan'    => (float)$keuangan['total_pendapatan'],
        'total_invoice'       => (int)$keuangan['total_invoice'],
        'total_pasien'       => (int)$pasien['total'],
        'pasien_baru'         => (int)$pasien['pasien_baru'],
        'pasien_lama'         => (int)$pasien['pasien_lama'],
        'per_metode'          => $per_metode,
        'per_kategori_layanan' => $per_kategori_layanan,
        'per_kategori_produk'  => $per_kategori_produk,
        'per_dokter'          => $per_dokter,
        'per_hari'            => $per_hari,
    ];
}

function rme_get_or_create(PDO $pdo, array $data): array
{
    require_fields($data, ['id_pendaftaran']);

    try {
        // Cek apakah RME sudah ada
        $stmt = $pdo->prepare("SELECT id FROM rekam_medis WHERE id_pendaftaran = ? LIMIT 1");
        $stmt->execute([(int)$data['id_pendaftaran']]);
        $existing = $stmt->fetch();

        if ($existing) {
            return rme_show($pdo, ['id' => $existing['id']]);
        }

        // Belum ada — ambil data pendaftaran
        $stmt = $pdo->prepare(
            "SELECT p.id_pasien, p.id_dokter, p.id_layanan, p.id_paket_layanan
             FROM pendaftaran p 
             WHERE p.id = ? AND p.status = 'dipanggil'"
        );
        $stmt->execute([(int)$data['id_pendaftaran']]);
        $pendaftaran = $stmt->fetch();
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }

    if (!$pendaftaran) throw new BridgeException('Pendaftaran tidak ditemukan atau belum dipanggil', 404);

    safe_query($pdo,
        "INSERT INTO rekam_medis (id_pendaftaran, id_pasien, id_dokter, status)
         VALUES (?, ?, ?, 'draft')",
        [(int)$data['id_pendaftaran'], (int)$pendaftaran['id_pasien'], (int)$pendaftaran['id_dokter']]
    );

    $newId = (int)$pdo->lastInsertId();

    try {
        if (!empty($pendaftaran['id_paket_layanan'])) {
            $stmt = $pdo->prepare("SELECT id_layanan, harga_total FROM paket_layanan WHERE id = ?");
            $stmt->execute([(int)$pendaftaran['id_paket_layanan']]);
            $paket = $stmt->fetch();
            
            if ($paket) {
                // Auto-populate Tindakan (Step 2)
                safe_query($pdo,
                    "INSERT INTO tindakan_pasien (id_rme, id_layanan, id_paket_layanan, harga_saat_itu, keterangan)
                     VALUES (?,?,?,?,?)",
                    [$newId, $paket['id_layanan'], $pendaftaran['id_paket_layanan'], $paket['harga_total'], 'Auto-filled dari paket pendaftaran']
                );

                // Auto-populate Resep (Step 3)
                $stmt = $pdo->prepare("SELECT id_produk, jumlah FROM paket_produk WHERE id_paket_layanan = ?");
                $stmt->execute([(int)$pendaftaran['id_paket_layanan']]);
                $produkList = $stmt->fetchAll();

                if (!empty($produkList)) {
                    safe_query($pdo, "INSERT INTO resep (id_rme, id_pasien, status) VALUES (?, ?, 'draft')", 
                        [$newId, $pendaftaran['id_pasien']]);
                    $idResep = (int)$pdo->lastInsertId();

                    $stmtInsertDetail = $pdo->prepare(
                        "INSERT INTO detail_resep (id_resep, id_produk, jumlah, aturan_pakai) VALUES (?, ?, ?, '')"
                    );
                    foreach ($produkList as $prod) {
                        $stmtInsertDetail->execute([$idResep, $prod['id_produk'], $prod['jumlah']]);
                    }
                }
            }
        } elseif (!empty($pendaftaran['id_layanan'])) {
            $stmt = $pdo->prepare("SELECT harga FROM layanan WHERE id = ?");
            $stmt->execute([(int)$pendaftaran['id_layanan']]);
            $layanan = $stmt->fetch();
            if ($layanan) {
                // Auto-populate Tindakan (Step 2)
                safe_query($pdo,
                    "INSERT INTO tindakan_pasien (id_rme, id_layanan, harga_saat_itu, keterangan)
                     VALUES (?,?,?,?)",
                    [$newId, $pendaftaran['id_layanan'], $layanan['harga'], 'Auto-filled dari pendaftaran']
                );
            }
        }
    } catch (PDOException $e) {
        // Abaikan error pada auto-populate agar proses create RME tetap berhasil
    }

    return rme_show($pdo, ['id' => $newId]);
}

function layanan_delete(PDO $pdo, array $data): array
{
    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        throw new BridgeException('ID layanan wajib diisi');
    }

    try {
        // Optional: check if layanan exists
        $check = $pdo->prepare("SELECT id FROM layanan WHERE id = ?");
        $check->execute([$id]);
        if (!$check->fetch()) {
            throw new BridgeException('Layanan tidak ditemukan');
        }
    } catch (PDOException $e) {
        throw new BridgeException('DB Error: ' . $e->getMessage());
    }
    
    // Soft delete — just deactivate
    safe_query($pdo,
        "UPDATE layanan SET is_aktif = IF(is_aktif = 1, 0, 1), updated_at = NOW() WHERE id = ?",
        [$id]
    );

    return [
        'success' => true,
        'message' => 'Layanan berhasil dinonaktifkan',
    ];
}
function invoice_generateMissing(PDO $pdo, array $data): array
{
    // 1. Get id_karyawan from the incoming data
    $id_karyawan = (int)($data['id_karyawan'] ?? 0);
    if ($id_karyawan === 0) {
        throw new BridgeException('id_karyawan wajib diisi');
    }

    // 2. Select completed pendaftaran that do NOT have an invoice yet
    $stmt = $pdo->prepare(
        "SELECT p.id 
         FROM pendaftaran p
         LEFT JOIN invoice i ON i.id_pendaftaran = p.id
         WHERE p.status = 'selesai' AND i.id IS NULL"
    );
    $stmt->execute();
    $missingPendaftaran = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    $generatedInvoices = [];
    $skipped = [];

    // 3. Process each missing pendaftaran
    foreach ($missingPendaftaran as $id_pendaftaran) {
        try {
            $result = invoice_generate($pdo, [
                'id_pendaftaran' => (int)$id_pendaftaran,
                'id_karyawan'    => $id_karyawan // Use the ID passed from the frontend
            ]);
            $generatedInvoices[] = $result;
        } catch (Throwable $e) {
            // If one fails, log the error and continue to the next
            $skipped[] = [
                'id_pendaftaran' => $id_pendaftaran,
                'error' => $e->getMessage()
            ];
        }
    }

    return [
        'success'  => true,
        'generated_count' => count($generatedInvoices),
        'generated' => $generatedInvoices,
        'skipped'   => $skipped,
    ];
}

// =============================================================================
// PENDAFTARAN + INVOICE QUERIES
// =============================================================================

/**
 * Get all pendaftaran joined with invoice where invoice status = 'belum_bayar'
 * Action: "pendaftaran.belumBayar"
 */
function pendaftaran_belumBayar(PDO $pdo, array $data): array
{
    $page   = (int)($data['page'] ?? 1);
    $params = [];
    $where  = ["(i.status = 'belum_bayar' OR i.id IS NULL)"];

    if (!empty($data['tanggal']))   { $where[] = "p.tanggal = ?";      $params[] = $data['tanggal']; }
    if (!empty($data['id_dokter'])) { $where[] = "p.id_dokter = ?";    $params[] = (int)$data['id_dokter']; }

    $sql = "SELECT
                p.id                    AS id_pendaftaran,
                p.no_antrian,
                p.tanggal,
                p.status                AS status_pendaftaran,
                p.jenis_kunjungan,
                p.keluhan_utama,
                pas.id                  AS id_pasien,
                pas.nama_lengkap        AS nama_pasien,
                pas.no_rekam_medis,
                pas.no_whatsapp,
                pen.nama_lengkap        AS nama_dokter,
                l.nama_layanan,
                i.id                    AS id_invoice,
                i.no_invoice,
                i.subtotal,
                i.diskon,
                i.total,
                i.total_dibayar,
                i.status                AS status_invoice,
                i.created_at            AS invoice_created_at
            FROM pendaftaran p
            JOIN pasien pas  ON pas.id  = p.id_pasien
            JOIN dokter d    ON d.id    = p.id_dokter
            JOIN pengguna pen ON pen.id = d.id_pengguna
            LEFT JOIN layanan l ON l.id = p.id_layanan
            LEFT JOIN invoice i   ON i.id_pendaftaran = p.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY p.tanggal DESC, p.no_antrian ASC";

    return paginate($pdo, $sql, $params, $page);
}

/**
 * Get all pendaftaran joined with invoice where invoice status = 'lunas'
 * Action: "pendaftaran.lunas"
 */
function pendaftaran_lunas(PDO $pdo, array $data): array
{
    $page   = (int)($data['page'] ?? 1);
    $params = [];
    $where  = ["i.status = 'lunas'"];

    if (!empty($data['tanggal']))   { $where[] = "p.tanggal = ?";   $params[] = $data['tanggal']; }
    if (!empty($data['id_dokter'])) { $where[] = "p.id_dokter = ?"; $params[] = (int)$data['id_dokter']; }

    $sql = "SELECT
                p.id                    AS id_pendaftaran,
                p.no_antrian,
                p.tanggal,
                p.status                AS status_pendaftaran,
                p.jenis_kunjungan,
                p.keluhan_utama,
                pas.id                  AS id_pasien,
                pas.nama_lengkap        AS nama_pasien,
                pas.no_rekam_medis,
                pas.no_whatsapp,
                pen.nama_lengkap        AS nama_dokter,
                l.nama_layanan,
                i.id                    AS id_invoice,
                i.no_invoice,
                i.subtotal,
                i.diskon,
                i.total,
                i.total_dibayar,
                i.status                AS status_invoice,
                i.created_at            AS invoice_created_at
            FROM pendaftaran p
            JOIN pasien pas   ON pas.id  = p.id_pasien
            JOIN dokter d     ON d.id    = p.id_dokter
            JOIN pengguna pen ON pen.id  = d.id_pengguna
            LEFT JOIN layanan l ON l.id  = p.id_layanan
            LEFT JOIN invoice i    ON i.id_pendaftaran = p.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY p.tanggal DESC, p.no_antrian ASC";

    return paginate($pdo, $sql, $params, $page);
}

// =============================================================================
// REKAM MEDIS — LATEST PER PASIEN
// =============================================================================

/**
 * Get the single latest rekam_medis per pasien (by updated_at),
 * joined with pasien, and both diagnosa rows.
 * Action: "rme.latestPerPasien"
 */
function rme_latestPerPasien(PDO $pdo, array $data): array
{
    $page = (int)($data['page'] ?? 1);

    /*
     * Strategy: use a subquery to get the MAX(updated_at) id per pasien,
     * then join back to get the full row. This avoids GROUP BY ambiguity
     * across MySQL strict-mode and MariaDB.
     */
    $sql = "SELECT
                rm.id                       AS id_rme,
                rm.id_pendaftaran,
                rm.status,
                rm.subjektif,
                rm.objektif,
                rm.assesment,
                rm.plan,
                rm.kondisi_masuk,
                rm.kondisi_keluar,
                rm.instruksi_tindak_lanjut,
                rm.created_at,
                rm.updated_at,
                pas.id                      AS id_pasien,
                pas.nama_lengkap            AS nama_pasien,
                pas.no_rekam_medis,
                pas.tanggal_lahir,
                pas.jenis_kelamin,
                pas.no_whatsapp,
                pas.alergi,
                pas.catatan_kulit,
                du.id                       AS id_diagnosa_utama,
                du.kode_icd10               AS kode_diagnosa_utama,
                du.nama_diagnosa            AS nama_diagnosa_utama,
                ds.id                       AS id_diagnosa_sekunder,
                ds.kode_icd10               AS kode_diagnosa_sekunder,
                ds.nama_diagnosa            AS nama_diagnosa_sekunder
            FROM rekam_medis rm
            /* Keep only the latest RME row per pasien */
            INNER JOIN (
                SELECT id_pasien, MAX(updated_at) AS latest_updated
                FROM rekam_medis
                GROUP BY id_pasien
            ) latest ON latest.id_pasien = rm.id_pasien
                    AND latest.latest_updated = rm.updated_at
            JOIN pasien pas ON pas.id = rm.id_pasien
            LEFT JOIN diagnosa du ON du.id = rm.id_diagnosa_utama
            LEFT JOIN diagnosa ds ON ds.id = rm.id_diagnosa_sekunder
            ORDER BY rm.updated_at DESC";

    return paginate($pdo, $sql, [], $page);
}

// =============================================================================
  // PAKET LAYANAN
  // =============================================================================

  function paket_layanan_index(PDO $pdo, array $data): array
  {
      $page        = (int)($data['page'] ?? 1);
      $hanya_aktif = $data['aktif'] ?? false;

      $sql = "SELECT pl.*,
                     l.nama_layanan,
                     l.harga as harga_layanan
              FROM paket_layanan pl
              JOIN layanan l ON l.id = pl.id_layanan";
      if ($hanya_aktif) $sql .= " WHERE pl.is_aktif = 1";
      $sql .= " ORDER BY pl.nama_paket ASC";

      $result = paginate($pdo, $sql, [], $page);

      // Attach produk to each paket
      if (!empty($result['data'])) {
          foreach ($result['data'] as &$paket) {
              $stmt = $pdo->prepare(
                  "SELECT pp.id_produk, pp.jumlah, pr.nama_produk, pr.harga_jual as harga_satuan
                   FROM paket_produk pp
                   JOIN produk pr ON pr.id = pp.id_produk
                   WHERE pp.id_paket_layanan = ?"
              );
              $stmt->execute([(int)$paket['id']]);
              $paket['produk'] = $stmt->fetchAll();
          }
      }

      return $result;
  }

  function paket_layanan_show(PDO $pdo, array $data): array
  {
      require_fields($data, ['id']);

      try {
          $stmt = $pdo->prepare(
              "SELECT pl.*,
                      l.nama_layanan,
                      l.harga as harga_layanan
               FROM paket_layanan pl
               JOIN layanan l ON l.id = pl.id_layanan
               WHERE pl.id = ?"
          );
          $stmt->execute([(int)$data['id']]);
          $paket = $stmt->fetch();
      } catch (PDOException $e) {
          throw new BridgeException('DB Error: ' . $e->getMessage());
      }

      if (!$paket) throw new BridgeException('Paket layanan tidak ditemukan', 404);

      // Get produk
      $stmt = $pdo->prepare(
          "SELECT pp.id_produk, pp.jumlah, pr.nama_produk, pr.harga_jual as harga_satuan
           FROM paket_produk pp
           JOIN produk pr ON pr.id = pp.id_produk
           WHERE pp.id_paket_layanan = ?"
      );
      $stmt->execute([(int)$data['id']]);
      $paket['produk'] = $stmt->fetchAll();

      return $paket;
  }

  function paket_layanan_store(PDO $pdo, array $data): array
  {
      require_fields($data, ['nama_paket', 'id_layanan', 'harga_total']);

      $pdo->beginTransaction();
      try {
          // Insert paket
          safe_query($pdo,
              "INSERT INTO paket_layanan
                  (nama_paket, id_layanan, harga_total, total_kunjungan, sisa_kunjungan, is_aktif)
               VALUES (?, ?, ?, ?, ?, 1)",
              [
                  $data['nama_paket'],
                  (int)$data['id_layanan'],
                  (float)$data['harga_total'],
                  (int)($data['total_kunjungan'] ?? 1),
                  (int)($data['total_kunjungan'] ?? 1),
              ]
          );
          $id_paket = (int)$pdo->lastInsertId();

          // Insert produk if any
          if (!empty($data['produk']) && is_array($data['produk'])) {
              $stmt = $pdo->prepare(
                  "INSERT INTO paket_produk (id_paket_layanan, id_produk, jumlah) VALUES (?, ?, ?)"
              );
              foreach ($data['produk'] as $prod) {
                  $stmt->execute([
                      $id_paket,
                      (int)$prod['id_produk'],
                      (int)($prod['jumlah'] ?? 1),
                  ]);
              }
          }

          $pdo->commit();
      } catch (Throwable $e) {
          $pdo->rollBack();
          throw new BridgeException('DB Error (Store Paket): ' . $e->getMessage());
      }

      return ['id' => $id_paket];
  }

  function paket_layanan_update(PDO $pdo, array $data): array
  {
      require_fields($data, ['id']);

      $pdo->beginTransaction();
      try {
          // Update paket
          $fields = "nama_paket=?, id_layanan=?, harga_total=?, total_kunjungan=?, is_aktif=?";
          $params = [
              $data['nama_paket'] ?? '',
              (int)($data['id_layanan'] ?? 0),
              (float)($data['harga_total'] ?? 0),
              (int)($data['total_kunjungan'] ?? 1),
              (int)($data['is_aktif'] ?? 1),
              (int)$data['id'],
          ];

          safe_query($pdo, "UPDATE paket_layanan SET {$fields} WHERE id=?", $params);

          // Update produk - delete all and re-insert
          safe_query($pdo, "DELETE FROM paket_produk WHERE id_paket_layanan=?", [(int)$data['id']]);

          if (!empty($data['produk']) && is_array($data['produk'])) {
              $stmt = $pdo->prepare(
                  "INSERT INTO paket_produk (id_paket_layanan, id_produk, jumlah) VALUES (?, ?, ?)"
              );
              foreach ($data['produk'] as $prod) {
                  $stmt->execute([
                      (int)$data['id'],
                      (int)$prod['id_produk'],
                      (int)($prod['jumlah'] ?? 1),
                  ]);
              }
          }

          $pdo->commit();
      } catch (Throwable $e) {
          $pdo->rollBack();
          throw new BridgeException('DB Error (Update Paket): ' . $e->getMessage());
      }

      return ['success' => true];
  }

  function paket_layanan_delete(PDO $pdo, array $data): array
  {
      require_fields($data, ['id']);

      $pdo->beginTransaction();
      try {
          // Delete produk first
          safe_query($pdo, "DELETE FROM paket_produk WHERE id_paket_layanan=?", [(int)$data['id']]);
          // Delete paket
          safe_query($pdo, "DELETE FROM paket_layanan WHERE id=?", [(int)$data['id']]);
          $pdo->commit();
      } catch (Throwable $e) {
          $pdo->rollBack();
          throw new BridgeException('DB Error (Delete Paket): ' . $e->getMessage());
      }

      return ['success' => true];
  }

  function paket_layanan_pasien_datang(PDO $pdo, array $data): array
  {
      require_fields($data, ['id_pendaftaran']);

      $id_pendaftaran = (int)$data['id_pendaftaran'];

      try {
          $stmt = $pdo->prepare(
              "SELECT pk.id, pk.sisa_kunjungan, pk.total_kunjungan, pl.id_layanan,
                      pk.id_paket_layanan,
                      p.id_pasien, p.id_dokter, p.id_karyawan
               FROM paket_kunjungan pk
               JOIN paket_layanan pl ON pl.id = pk.id_paket_layanan
               JOIN pendaftaran p ON p.id = pk.id_pendaftaran
               WHERE p.id = ? AND pk.sisa_kunjungan > 0
               LIMIT 1"
          );
          $stmt->execute([$id_pendaftaran]);
          $paket = $stmt->fetch();
      } catch (PDOException $e) {
          throw new BridgeException('DB Error: ' . $e->getMessage());
      }

      if (!$paket) throw new BridgeException('Paket tidak ditemukan atau sudah selesai', 404);

      $new_sisa = (int)$paket['sisa_kunjungan'] - 1;
      $kunjungan_ke = (int)$paket['total_kunjungan'] - $new_sisa;
      $total_kunjungan = max(1, (int)$paket['total_kunjungan']);

      $pdo->beginTransaction();
      try {
          // Kurangi stok produk
          $stmt2 = $pdo->prepare("SELECT id_produk, jumlah FROM paket_produk WHERE id_paket_layanan = ?");
          $stmt2->execute([$paket['id_paket_layanan']]);
          foreach ($stmt2->fetchAll() as $pp) {
              $jml_per_visit = max(1, (int)ceil($pp['jumlah'] / $total_kunjungan));
              safe_query($pdo, "UPDATE produk SET stok = GREATEST(0, stok - ?) WHERE id=?", 
                  [$jml_per_visit, (int)$pp['id_produk']]);
          }

          // Catat riwayat kunjungan dengan membuat pendaftaran baru 
          $no_antrian = generate_no_antrian($pdo, date('Y-m-d'));
          safe_query($pdo,
              "INSERT INTO pendaftaran (no_antrian, tanggal, id_pasien, id_dokter, id_layanan, id_karyawan, keluhan_utama, jenis_kunjungan, status, id_paket_layanan)
               VALUES (?, CURDATE(), ?, ?, ?, ?, ?, 'lama', 'antri', ?)",
              [$no_antrian, $paket['id_pasien'], $paket['id_dokter'], $paket['id_layanan'], $paket['id_karyawan'], 
               "Kunjungan Paket (Ke-{$kunjungan_ke})", $paket['id_paket_layanan']]
          );

          if ($new_sisa <= 0) {
              safe_query($pdo,
                  "UPDATE paket_kunjungan SET sisa_kunjungan=0, status='selesai', last_visit_date=CURDATE() WHERE id=?",
                  [(int)$paket['id']]
              );
          } else {
              safe_query($pdo,
                  "UPDATE paket_kunjungan SET sisa_kunjungan=?, last_visit_date=CURDATE() WHERE id=?",
                  [$new_sisa, (int)$paket['id']]
              );
          }
          $pdo->commit();
          
          return [
              'success' => true,
              'last_visit' => ($new_sisa <= 0),
              'sisa_kunjungan' => max(0, $new_sisa),
              'message' => "Kunjungan berhasil dicatat dan masuk antrian hari ini. Sisa {$new_sisa} kunjungan.",
          ];
      } catch (Throwable $e) {
          $pdo->rollBack();
          throw new BridgeException('DB Error (Kunjungan Paket): ' . $e->getMessage());
      }
  }