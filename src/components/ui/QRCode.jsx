import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCode = ({ value, size = 128, level = 'H', id }) => {
    return (
        <div className="bg-white p-2 border-2 border-gray-100 rounded-lg inline-block shadow-sm">
            <QRCodeCanvas
                id={id}
                value={value}
                size={size}
                level={level}
                includeMargin={true}
            />
        </div>
    );
};

export default QRCode;
