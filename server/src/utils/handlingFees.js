const HANDLING_FEES = {
  Small: 500,
  Medium: 700,
  Large: 1000,
  'Extra Large': 1200,
};

function getHandlingFee(size) {
  const fee = HANDLING_FEES[size];
  if (fee === undefined) throw new Error(`Invalid parcel size: ${size}`);
  return fee;
}

module.exports = { HANDLING_FEES, getHandlingFee };
