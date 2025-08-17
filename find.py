import os

def search_teleport(root_folder):
    matches = []
    for dirpath, dirnames, filenames in os.walk(root_folder):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            try:
                with open(file_path, encoding='utf-8', errors='ignore') as file:
                    for i, line in enumerate(file, 1):
                        if 'teleport' in line.lower():
                            matches.append((file_path, i, line.strip()))
            except Exception as e:
                print(f"Could not read {file_path}: {e}")

    if matches:
        print("\nFound 'teleport' references:")
        for path, lineno, content in matches:
            print(f"{path}:{lineno}: {content}")
    else:
        print("\nNo 'teleport' references found. 🍾🎉")

if __name__ == "__main__":
    folder = input("Enter the path to your codebase folder: ").strip()
    search_teleport(folder)
