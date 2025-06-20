export const jwtConstants = {
  get secret() {
    return process.env.JWT_SECRET;
  },
  get expirationTime() {
    return process.env.JWT_EXPIRES_IN;
  },
};
