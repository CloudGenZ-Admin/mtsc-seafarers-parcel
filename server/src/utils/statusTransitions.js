const LIFECYCLE = {
  AwaitingShipment: 'Shipped',
  Shipped: 'Arrived',
  Arrived: 'Delivered',
};

const TIMESTAMP_FIELDS = {
  Shipped: 'shippedAt',
  Arrived: 'arrivedAt',
  Delivered: 'deliveredAt',
};

function validateTransition(currentStatus, targetStatus) {
  return LIFECYCLE[currentStatus] === targetStatus;
}

function getTimestampField(status) {
  return TIMESTAMP_FIELDS[status] || null;
}

module.exports = { validateTransition, getTimestampField };
