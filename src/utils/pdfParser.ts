import fs from 'fs';
import pdf from 'pdf-parse';

export const parsePDF = (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const dataBuffer = fs.readFileSync(filePath);
        pdf(dataBuffer).then(data => {
            resolve(data.text);
        }).catch(error => {
            reject(error);
        });
    });
};

export const extractMetadata = (filePath: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const dataBuffer = fs.readFileSync(filePath);
        pdf(dataBuffer).then(data => {
            resolve({
                numpages: data.numpages,
                info: data.info,
                metadata: data.metadata,
            });
        }).catch(error => {
            reject(error);
        });
    });
};