# Read SettingsView test
with open('src/renderer/src/components/__tests__/SettingsView.test.tsx', 'r') as f:
    content = f.read()

# Add vi.mock for framer-motion AnimatePresence if not present
if 'vi.mock' in content and 'SettingsView' in content:
    print("SettingsView test OK - has mocks")
else:
    print("SettingsView test needs review")

# Check if tests need axios-style pre-resolution
print("Done checking SettingsView test")
