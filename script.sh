#!/bin/bash
export UPLOAD_SERVICE_ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )" >> ~/.bashrc
echo
echo "Opening port on $1"
echo
if [ "$1" != "" ]; then
    echo "UPLOAD_SERVICE_PORT=$1" > $UPLOAD_SERVICE_ROOT_DIR/.env
    firewall-cmd --permanent --add-port=$1/tcp
else
    echo "UPLOAD_SERVICE_PORT=8000" > $UPLOAD_SERVICE_ROOT_DIR/.env
    firewall-cmd --permanent --add-port=8080/tcp
fi
echo
echo "Opened port successfully"
echo
echo "Installing Node"
echo
curl -sL https://rpm.nodesource.com/setup_12.x | sudo bash -
sudo yum install nodejs -y
echo
echo "Installed Node Successfully"
echo
echo "Installing dependencies"
echo
npm install
echo "Installed dependencies successfully"
echo
echo "Writing a service to run at startup"
echo
/bin/bash $UPLOAD_SERVICE_ROOT_DIR/lib/remove-service.sh
echo "#!/bin/bash" > /var/tmp/upload_service.sh
echo "cd $UPLOAD_SERVICE_ROOT_DIR && npm start" >> /var/tmp/upload_service.sh
chmod +x /var/tmp/upload_service.sh
cp $UPLOAD_SERVICE_ROOT_DIR/lib/upload.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable upload.service
systemctl start upload.service
echo
echo "Writing a service to run at startup successfuly"
echo