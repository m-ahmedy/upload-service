systemctl stop upload.service
systemctl disable upload.service
rm /etc/systemd/system/upload.service
rm /etc/systemd/system/upload.service # and symlinks that might be related
rm /usr/lib/systemd/system/upload.service 
rm /usr/lib/systemd/system/upload.service # and symlinks that might be related
systemctl daemon-reload
systemctl reset-failed