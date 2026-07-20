import re

with open('handler.php', 'r') as f:
    content = f.read()

# 1. pendaftaran_store
target1 = """            safe_query($pdo,
                "INSERT INTO paket_kunjungan (id_pendaftaran, id_paket_layanan, total_kunjungan, sisa_kunjungan, status)
                 VALUES (?, ?, ?, ?, 'aktif')",
                [$id_pendaftaran, $id_paket, $tk, $tk]
            );"""
rep1 = """            safe_query($pdo,
                "INSERT INTO paket_kunjungan (id_pendaftaran, id_paket_layanan, total_kunjungan, sisa_kunjungan, status)
                 VALUES (?, ?, ?, ?, 'aktif')",
                [$id_pendaftaran, $id_paket, $tk, max(0, $tk - 1)]
            );"""
content = content.replace(target1, rep1)

# 2. tindakan_store
target2 = """        safe_query($pdo,
            "INSERT INTO tindakan_pasien (id_rme, id_layanan, id_paket_layanan, harga_saat_itu, keterangan)
             VALUES (?,?,?,?,?)",
            [$data['id_rme'], $paket['id_layanan'], $data['id_paket_layanan'], $paket['harga_total'], $data['keterangan'] ?? '']
        );
        return ['id' => (int)$pdo->lastInsertId()];"""
rep2 = """        safe_query($pdo,
            "INSERT INTO tindakan_pasien (id_rme, id_layanan, id_paket_layanan, harga_saat_itu, keterangan)
             VALUES (?,?,?,?,?)",
            [$data['id_rme'], $paket['id_layanan'], $data['id_paket_layanan'], $paket['harga_total'], $data['keterangan'] ?? '']
        );
        $newTindakanId = (int)$pdo->lastInsertId();

        $stmt_pend = $pdo->prepare("SELECT id_pendaftaran, id_pasien FROM rekam_medis WHERE id = ?");
        $stmt_pend->execute([(int)$data['id_rme']]);
        $rmeInfo = $stmt_pend->fetch();

        if ($rmeInfo && $rmeInfo['id_pendaftaran']) {
            $id_pend = $rmeInfo['id_pendaftaran'];
            $idPasien = $rmeInfo['id_pasien'];
            
            $stmt_chk = $pdo->prepare("SELECT id FROM paket_kunjungan WHERE id_pendaftaran = ? AND id_paket_layanan = ?");
            $stmt_chk->execute([$id_pend, $data['id_paket_layanan']]);
            if (!$stmt_chk->fetch()) {
                $stmt_tk = $pdo->prepare("SELECT total_kunjungan FROM paket_layanan WHERE id = ?");
                $stmt_tk->execute([(int)$data['id_paket_layanan']]);
                $tk = (int)$stmt_tk->fetchColumn();
                safe_query($pdo,
                    "INSERT INTO paket_kunjungan (id_pendaftaran, id_paket_layanan, total_kunjungan, sisa_kunjungan, status)
                     VALUES (?, ?, ?, ?, 'aktif')",
                    [$id_pend, $data['id_paket_layanan'], $tk, max(0, $tk - 1)]
                );
            }

            $stmt_pp = $pdo->prepare("SELECT id_produk, jumlah FROM paket_produk WHERE id_paket_layanan = ?");
            $stmt_pp->execute([(int)$data['id_paket_layanan']]);
            $produkList = $stmt_pp->fetchAll();
            
            if (!empty($produkList)) {
                $stmt_res = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
                $stmt_res->execute([(int)$data['id_rme']]);
                $idResep = $stmt_res->fetchColumn();
                
                if (!$idResep) {
                    safe_query($pdo, "INSERT INTO resep (id_rme, id_pasien, status) VALUES (?, ?, 'draft')", [$data['id_rme'], $idPasien]);
                    $idResep = (int)$pdo->lastInsertId();
                }
                
                foreach ($produkList as $prod) {
                    safe_query($pdo, "INSERT INTO detail_resep (id_resep, id_produk, jumlah, aturan_pakai) VALUES (?, ?, ?, '')", 
                        [$idResep, $prod['id_produk'], $prod['jumlah']]);
                }
            }
        }
        return ['id' => $newTindakanId];"""
content = content.replace(target2, rep2)

# 3. invoice_generate
target3 = """            // Item 3+: Produk dari resep
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
                        'id_referensi' => (int)$r['id'],
                        'nama_item'    => $r['nama_produk'],
                        'qty'          => (int)$r['jumlah'],
                        'harga_satuan' => (float)$r['harga_jual'],
                        'subtotal'     => $sub,
                    ];
                    $subtotal += $sub;
                }
            }"""
rep3 = """            // Item 3+: Produk dari resep
            $stmt = $pdo->prepare("SELECT id FROM resep WHERE id_rme = ? LIMIT 1");
            $stmt->execute([$pend['id_rme']]);
            $resep = $stmt->fetch();
            if ($resep) {
                $paket_produk_ids = [];
                if (!empty($pend['id_paket_layanan'])) {
                    $stmt_pp = $pdo->prepare("SELECT id_produk FROM paket_produk WHERE id_paket_layanan = ?");
                    $stmt_pp->execute([$pend['id_paket_layanan']]);
                    $paket_produk_ids = array_merge($paket_produk_ids, $stmt_pp->fetchAll(PDO::FETCH_COLUMN));
                }
                $stmt_tp = $pdo->prepare("SELECT id_paket_layanan FROM tindakan_pasien WHERE id_rme = ? AND id_paket_layanan IS NOT NULL");
                $stmt_tp->execute([$pend['id_rme']]);
                foreach ($stmt_tp->fetchAll() as $tp) {
                    $stmt_pp = $pdo->prepare("SELECT id_produk FROM paket_produk WHERE id_paket_layanan = ?");
                    $stmt_pp->execute([$tp['id_paket_layanan']]);
                    $paket_produk_ids = array_merge($paket_produk_ids, $stmt_pp->fetchAll(PDO::FETCH_COLUMN));
                }

                $stmt = $pdo->prepare(
                    "SELECT dr.id, dr.jumlah, pr.id as id_produk, pr.nama_produk, pr.harga_jual
                     FROM detail_resep dr
                     JOIN produk pr ON pr.id = dr.id_produk
                     WHERE dr.id_resep = ?"
                );
                $stmt->execute([(int)$resep['id']]);
                foreach ($stmt->fetchAll() as $r) {
                    $is_paket = in_array($r['id_produk'], $paket_produk_ids);
                    $harga = $is_paket ? 0 : (float)$r['harga_jual'];
                    $sub     = $harga * (int)$r['jumlah'];
                    $items[] = [
                        'jenis'        => 'produk',
                        'id_referensi' => (int)$r['id'],
                        'nama_item'    => $r['nama_produk'] . ($is_paket ? ' (Paket)' : ''),
                        'qty'          => (int)$r['jumlah'],
                        'harga_satuan' => $harga,
                        'subtotal'     => $sub,
                    ];
                    $subtotal += $sub;
                }
            }"""
content = content.replace(target3, rep3)

# 4. pembayaran_store manual deduction removal
target4 = """            // Deduct stok produk dari paket (jika ada) - Kunjungan Pertama
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

                    // Cek paket dari tindakan (RME)
                    $stmt6 = $pdo->prepare(
                        "SELECT tp.id_paket_layanan 
                         FROM tindakan_pasien tp
                         JOIN rekam_medis rm ON rm.id = tp.id_rme
                         WHERE rm.id_pendaftaran = ? AND tp.id_paket_layanan IS NOT NULL"
                    );
                    $stmt6->execute([$id_pend]);
                    foreach ($stmt6->fetchAll() as $tp) {
                        $stmt7 = $pdo->prepare("SELECT id_produk, jumlah FROM paket_produk WHERE id_paket_layanan = ?");
                        $stmt7->execute([$tp['id_paket_layanan']]);
                        foreach ($stmt7->fetchAll() as $pp) {
                            safe_query($pdo, "UPDATE produk SET stok = GREATEST(0, stok - ?) WHERE id=?", 
                                [(int)$pp['jumlah'], (int)$pp['id_produk']]);
                        }
                    }
                }
            } catch (PDOException $e) {
                throw new BridgeException('DB Error (Fetch Paket Produk): ' . $e->getMessage());
            }"""
content = content.replace(target4, "")

with open('handler.php', 'w') as f:
    f.write(content)
print("Updated handler.php")
