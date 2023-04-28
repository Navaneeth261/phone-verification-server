//Helper File for Auth Controller

export const updateUser = async (sessionId, user, verificationObject) => {
  user.verification = verificationObject;
  user.verificationHistory.set(sessionId, verificationObject);
  await user.save();
};

export const generateCode = () => {
  // Generate a 6-digit verification code
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  return verificationCode;
};

export const hashVerificaionCode = async () => {
  const salt = await bcrypt.genSalt();
  const hashedVerificationCode = await bcrypt.hash(verificationCode, salt);
  return hashedVerificationCode;
};

export const validateRegister = (user) => {
  //Handle all Validation required for Register User here
  if (user && user.userStatus === "Registered") {
    return {
      status: false,
      message: "User already registered. Please login to continue",
    };
  }
  return {
    status: true,
    message: "User is eligible to generate Register code",
  };
};

export const validateLogin = (user) => {
  //Handle all Validation required for Login User here
  if (!user || user.userStatus !== "Registered") {
    return {
      status: false,
      message:
        "This phone number not registered with us. Please register to continue",
    };
  }
  return {
    status: true,
    message: "User is eligible to generate Login code",
  };
};

export const validateGenerateCodeInputs = (requestBody) => {
  const { countryCode, phoneNumber } = requestBody;
  if (!countryCode || !phoneNumber) {
    return {
      status: false,
      message: "Missing required fields in request body",
    };
  }
  return { status: true };
};

export const validateVerifyAndRegisterInputs = (requestBody) => {
  const { name, countryCode, phoneNumber, verificationCode } = requestBody;

  if (!name || !countryCode || !phoneNumber || !verificationCode) {
    return {
      status: false,
      message: "Missing required fields in request body",
    };
  }
  return { status: true };
};

export const validateVerifyAndLoginInputs = (requestBody) => {
  const { countryCode, phoneNumber, verificationCode } = requestBody;

  if (!countryCode || !phoneNumber || !verificationCode) {
    return {
      status: false,
      message: "Missing required fields in request body",
    };
  }
  return { status: true };
};

export const validateRegisterVerification = (user) => {
  //Handle all Validation required for Register User here
  if (user.userStatus === "Registered") {
    return {
      status: false,
      message: "User already registered. Please login to continue.",
    };
  }
  return {
    status: true,
    message: "User is eligible to Register with code",
  };
};

export const validateLoginVerification = (user) => {
  //Handle all Validation required for Login User here
  if (user.userStatus !== "Registered") {
    return {
      status: false,
      message:
        "This phone number is not yet registered with us. Please register to continue.",
    };
  } else if (user.verification.isVerified) {
    return {
      status: false,
      message:
        "This phone number is already verified with last generated code. Please generate new code to verify again.",
    };
  }
  return {
    status: true,
    message: "User is eligible to Login with code",
  };
};
