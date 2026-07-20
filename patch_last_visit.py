import re

with open('handler.php', 'r') as f:
    content = f.read()

target = """      $new_sisa = (int)$paket['sisa_kunjungan'] - 1;

      $pdo->beginTransaction();"""
rep = """      $new_sisa = (int)$paket['sisa_kunjungan'] - 1;

      // Auto migrate table to add last_visit_date if not exists
      try {
          $pdo->exec("ALTER TABLE paket_kunjungan ADD COLUMN last_visit_date DATE DEFAULT NULL");
      } catch (PDOException $e) {}

      $pdo->beginTransaction();"""
content = content.replace(target, rep)

target2 = """              safe_query($pdo,
                  "UPDATE paket_kunjungan SET sisa_kunjungan=0, status='selesai' WHERE id=?",
                  [(int)$paket['id']]
              );"""
rep2 = """              safe_query($pdo,
                  "UPDATE paket_kunjungan SET sisa_kunjungan=0, status='selesai', last_visit_date=CURDATE() WHERE id=?",
                  [(int)$paket['id']]
              );"""
content = content.replace(target2, rep2)

target3 = """              safe_query($pdo,
                  "UPDATE paket_kunjungan SET sisa_kunjungan=? WHERE id=?",
                  [$new_sisa, (int)$paket['id']]
              );"""
rep3 = """              safe_query($pdo,
                  "UPDATE paket_kunjungan SET sisa_kunjungan=?, last_visit_date=CURDATE() WHERE id=?",
                  [$new_sisa, (int)$paket['id']]
              );"""
content = content.replace(target3, rep3)

target4 = """                         pk.sisa_kunjungan, pk.total_kunjungan"""
rep4 = """                         pk.sisa_kunjungan, pk.total_kunjungan, pk.last_visit_date"""
content = content.replace(target4, rep4)

with open('handler.php', 'w') as f:
    f.write(content)
print("Updated handler for last_visit_date")
