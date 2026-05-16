#!/usr/bin/env bash
# Install official Zoom .deb after removing Flatpak Zoom (run once on your laptop).
# Usage: chmod +x scripts/install-zoom-deb.sh && ./scripts/install-zoom-deb.sh
set -euo pipefail
DEB="${HOME}/Downloads/zoom_amd64.deb"
if [[ ! -f "$DEB" ]]; then
    echo "Expected $DEB — place zoom_amd64.deb in Downloads or edit DEB path in this script."
    exit 1
fi

if command -v flatpak >/dev/null 2>&1 && flatpak list --app 2>/dev/null | grep -q us.zoom.Zoom; then
    echo "Removing Flatpak Zoom (us.zoom.Zoom)..."
    flatpak uninstall -y us.zoom.Zoom
fi

echo "Installing Zoom from $DEB (needs sudo password)..."
sudo dpkg -i "$DEB" || sudo apt-get install -f -y
echo "Done. Try: zoom &"
