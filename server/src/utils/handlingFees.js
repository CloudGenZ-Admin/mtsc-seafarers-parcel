const HANDLING_FEES = {
  Small: 1500,
  Medium: 2000,
  Large: 3000,
};

function getHandlingFee(size) {
  const fee = HANDLING_FEES[size];
  if (fee === undefined) throw new Error(`Invalid parcel size: ${size}`);
  return fee;
}

module.exports = { HANDLING_FEES, getHandlingFee };
