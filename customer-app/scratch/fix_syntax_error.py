import os

file_path = r'c:\Users\Bhagyashree\OneDrive\Desktop\SetKarr\customer-app\screens\MapScreen.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indexing is 0-based.
# We want to keep lines 1 to 1024 (indices 0 to 1023).
# We want to keep lines 1268 onwards (indices 1267 onwards).
# Legacy block: 1025 to 1267 (indices 1024 to 1266).

new_lines = lines[:1024] + lines[1267:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Successfully processed {len(lines)} lines. Removed {len(lines) - len(new_lines)} lines.")
