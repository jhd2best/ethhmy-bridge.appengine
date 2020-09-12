export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const payloadKeys = [
  'gas',
  'gasPrice',
  'gasUsed',
  'gasLimit',
  'blockHash',
  'blockNumber',
  'transactionHash',
];

export function clearPayload(obj: any) {
  const newObj = payloadKeys.reduce((acc: any, key: string) => {
    if (obj[key]) {
      acc[key] = String(obj[key]);
    }

    return acc;
  }, {});

  return newObj;
}
