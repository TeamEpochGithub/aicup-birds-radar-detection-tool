# The goal of this script is to compress the train.csv and test.csv to a smaller binary format
# so the site is mobile friendly to load and the files are easier to compress to an acceptable format size
# The test CSV is obfuscated to make it clear to users that scraping and reverse engineering the test file without agreeing to the competition rules is forbidden.

import pandas as pd
import struct
import numpy as np
import json
import binascii

# --- CONFIGURATION ---

BIRD_SPECIES = [
    'Unknown', 'Dunlin', 'Black-headed Gull', 'European Herring Gull', 'Barn Swallow',
    'Common Starling', 'Common Buzzard', 'Common Gull', 'Great Cormorant',
    'Common Linnet', 'Eurasian Curlew', 'Feral Pigeon', 'Common Kestrel',
    'Western Jackdaw', 'Eurasian Magpie', 'Pigeon', 'Western Marsh Harrier',
    'Car', 'Common Wood Pigeon', 'Gull', 'Lesser Black-backed Gull',
    'European Golden Plover', 'Train', 'White Wagtail', 'Northern Lapwing',
    'Arctic Tern', 'Common Snipe', 'Greylag Goose', 'Carrion Crow', 'Mallard',
    'Great Black-backed Gull', 'Barnacle Goose', 'Tundra Bean Goose', 'Wader',
    'Duck', 'Turbine', 'Clutter', 'Goose', 'Common Gull and Black-headed Gull',
    'European Goldfinch', 'Sanderling', 'Homing Pigeon', 'Pipit', 'Meadow Pipit',
    'Songbird', 'Common Chaffinch', 'Stock Dove', 'Northern Pintail',
    'Song Thrush', 'Greater White-fronted Goose', 'Fieldfare',
    'Peregrine Falcon', 'Gadwall', 'Grey Plover', 'Eurasian Skylark', 'Redwing',
    'Rock Pipit', 'Eurasian Sparrowhawk', 'Blue Tit', 'Brambling', 'Crow',
    'Eurasian Oystercatcher', 'Common Shelduck', 'Rain', 'Common Redshank',
    'Egyptian Goose', 'Large Gull', 'Common Tern', 'Sheep'
]

BIRD_GROUPS = [
    "Unknown", "Clutter", "Cormorants", "Pigeons", "Ducks", "Geese", "Gulls", 
    "Birds of Prey", "Waders", "Songbirds"
]

RADAR_SIZES = ["Large bird", "Small bird", "Medium", "Large", "Flock"]

XOR_KEY = "ACCEPT_THE_COMPETITION_TERMS_AT_https://www.kaggle.com/competitions/ai-cup-2026-performance/rules_TO_USE_THE_TEST_SET_DO_NOT_REVERSE_ENGINEER"

# --- HELPER FUNCTIONS ---

def get_enum_val(val, enum_list):
    if pd.isna(val) or val not in enum_list:
        return 0 # Default to index 0 (Unknown)
    return enum_list.index(val)

def parse_wkb_hex(hex_str):
    if pd.isna(hex_str) or hex_str == "":
        return b""
    try:
        # Strip 0x or \x if present
        clean = hex_str.replace("0x", "").replace("\\x", "")
        return binascii.unhexlify(clean)
    except:
        return b""

def parse_float_list(json_str):
    if pd.isna(json_str):
        return []
    try:
        # Handle Python list string format if necessary
        s = json_str.replace("'", '"')
        return json.loads(s)
    except:
        return []

def to_timestamp(ts_str):
    if pd.isna(ts_str):
        return 0
    try:
        dt = pd.to_datetime(ts_str, utc=True)
        return int(dt.timestamp())
    except:
        return 0

def pack_string(s):
    if pd.isna(s):
        b = b""
    else:
        b = str(s).encode('utf-8')
    return struct.pack('<H', len(b)) + b

def pack_blob(b):
    return struct.pack('<H', len(b)) + b

# --- MAIN CONVERTER ---

def write_binary(filename, df, is_test=False):
    with open(filename, 'wb') as f:
        # Buffer to hold all data before encryption (for test) or writing
        file_buffer = bytearray()

        for _, row in df.iterrows():
            # 1. Track ID (Uint32)
            try:
                tid = int(row.get('track_id', 0))
            except: tid = 0
            file_buffer.extend(struct.pack('<I', tid))

            # 2. Timestamps (Uint32 x2)
            file_buffer.extend(struct.pack('<I', to_timestamp(row.get('timestamp_start_radar_utc'))))
            file_buffer.extend(struct.pack('<I', to_timestamp(row.get('timestamp_end_radar_utc'))))

            # 3. Trajectory (Length Prefixed Blob)
            traj_blob = parse_wkb_hex(row.get('trajectory'))
            file_buffer.extend(pack_blob(traj_blob))

            # 4. Trajectory Time (Length Prefixed Float32 Array)
            t_times = parse_float_list(row.get('trajectory_time'))
            file_buffer.extend(struct.pack('<H', len(t_times)))
            for t in t_times:
                file_buffer.extend(struct.pack('<f', float(t)))

            # 5. Radar Bird Size (Enum Uint8)
            bs_idx = get_enum_val(row.get('radar_bird_size'), RADAR_SIZES)
            file_buffer.extend(struct.pack('<B', bs_idx))

            # 6. Scalars (Airspeed, MinZ, MaxZ) -> Float32
            file_buffer.extend(struct.pack('<f', float(row.get('airspeed', 0))))
            file_buffer.extend(struct.pack('<f', float(row.get('min_z', 0))))
            file_buffer.extend(struct.pack('<f', float(row.get('max_z', 0))))

            if not is_test:
                # --- TRAIN ONLY FIELDS ---
                
                # 7. Observation IDs (Uint32)
                # Assumes numeric. If strings, hash them or map them, but prompt requested Uint32
                try: obs_id = int(float(row.get('observation_id', 0)))
                except: obs_id = 0
                file_buffer.extend(struct.pack('<I', obs_id))
                
                try: p_obs_id = int(float(row.get('primary_observation_id', 0)))
                except: p_obs_id = 0
                file_buffer.extend(struct.pack('<I', p_obs_id))

                # 8. Observer Position (WKB Blob)
                obs_pos_blob = parse_wkb_hex(row.get('observer_position'))
                file_buffer.extend(pack_blob(obs_pos_blob))

                # 9. Observer Comment (String)
                file_buffer.extend(pack_string(row.get('observer_comment')))

                # 10. N Birds (Uint16)
                try: n_birds = int(float(row.get('n_birds_observed', 1)))
                except: n_birds = 1
                file_buffer.extend(struct.pack('<H', min(n_birds, 65535)))

                # 11. Bird Group (Enum Uint8)
                bg_idx = get_enum_val(row.get('bird_group'), BIRD_GROUPS)
                file_buffer.extend(struct.pack('<B', bg_idx))

                # 12. Bird Species (Enum Uint8)
                sp_idx = get_enum_val(row.get('bird_species'), BIRD_SPECIES)
                file_buffer.extend(struct.pack('<B', sp_idx))

        if is_test:
            print(f"Encrypting {filename} with XOR...")
            key_bytes = XOR_KEY.encode('utf-8')
            key_len = len(key_bytes)
            # Apply XOR
            # Convert to numpy for fast XOR or simple loop
            encrypted = bytearray(len(file_buffer))
            for i in range(len(file_buffer)):
                encrypted[i] = file_buffer[i] ^ key_bytes[i % key_len]
            f.write(encrypted)
        else:
            f.write(file_buffer)
            
    print(f"Wrote {filename}. Size: {len(file_buffer) / 1024 / 1024:.2f} MB")

if __name__ == "__main__":
    print("Loading CSVs...")
    try:
        df_train = pd.read_csv("train.csv")
        write_binary("train.bin", df_train, is_test=False)
    except FileNotFoundError:
        print("train.csv not found.")

    try:
        df_test = pd.read_csv("test.csv")
        write_binary("test.bin", df_test, is_test=True)
    except FileNotFoundError:
        print("test.csv not found.")