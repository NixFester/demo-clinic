import json
from datetime import datetime

# Your input JSON data
with open("master_icd_x.json", "r", encoding="utf-8") as f:
    json_data = json.load(f)

# Generate current timestamp for created_at and updated_at
current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# If you are reading from a file, uncomment the lines below and remove json_data above:
# with open('data.json', 'r', encoding='utf-8') as f:
#     json_data = json.load(f)

sql_values = []

for item in json_data:
    # Strip trailing spaces from the Indonesian name
    nama_diagnosa = item['nama_icd_indo'].strip()
    
    # Escape single quotes (') in the text so it doesn't break the SQL query
    # For example: O'Neil becomes O''Neil
    nama_diagnosa_escaped = nama_diagnosa.replace("'", "''")
    
    # Map the fields
    kode_icd10 = item['kode_icd']
    
    # Format the VALUES part of the SQL statement
    value_row = f"(NULL, '{kode_icd10}', '{nama_diagnosa_escaped}', '{current_time}', '{current_time}')"
    sql_values.append(value_row)

# Combine everything into the final INSERT statement
# Note: Change 'your_table_name' to your actual database table name
table_name = "your_table_name"
sql_query = f"INSERT INTO `{table_name}` (`id`, `kode_icd10`, `nama_diagnosa`, `created_at`, `updated_at`) VALUES\n"

# Join all rows with a comma and newline
sql_query += ",\n".join(sql_values) + ";"

# Optional: Save to a .sql file
with open('output.sql', 'w', encoding='utf-8') as f:
    f.write(sql_query)