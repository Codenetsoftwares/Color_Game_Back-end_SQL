import { body, param, query } from "express-validator";

export const testValidator = [
  body("email", "Invalid email").isEmail(),
  body("password", "Password must be at least 6 characters long").isLength({
    min: 6,
  }),
];

export const bidTypeSchema = [
  body("userId").exists().withMessage("User ID is required."),
  body("gameId").exists().withMessage("Game ID is required."),
  body("marketId").exists().withMessage("Market ID is required."),
  body("runnerId").exists().withMessage("Runner ID is required."),
  body("value").exists().withMessage("Value is required."),
  body("bidType")
    .exists()
    .withMessage("Bid Type is required.")
    .notEmpty()
    .withMessage("Bidding type must not be empty.")
    .isIn(["back", "lay"])
    .withMessage('Bidding type must be either "back" or "lay".'),
];

export const bidHistorySchema = [
  param("gameId").exists().withMessage("Game ID is required."),
  query("page")
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Page number must be a positive integer."),
  query("limit")
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer."),
];

export const currentOrderSchema = [
  param("gameId").exists().withMessage("Game ID is required."),
];

export const winningSchema = [
  body("marketId").notEmpty().withMessage("Market ID is required"),
  body("runnerId").notEmpty().withMessage("Runner ID is required"),
  body("isWin")
    .notEmpty()
    .withMessage("isWin field is required")
    .isBoolean()
    .withMessage("isWin must be a boolean value"),
];

export const loginSchema = [
  body("userName").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const resetPasswordSchema = [
  body("oldPassword").notEmpty().withMessage("Old Password is required"),
  body("newPassword").notEmpty().withMessage("New Password is required"),
];

export const trashUserSchema = [
  body("userId").notEmpty().withMessage("User ID is required."),
];

export const createdUserSchema = [
  body("userName").trim().notEmpty().withMessage("Username is required"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const createdGameSchema = [
  body("gameName").trim().notEmpty().withMessage("Game name is required"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description is required"),
  body("isBlink")
    .optional()
    .isBoolean()
    .notEmpty()
    .withMessage("isBlink must be a boolean"),
];

export const createdMarketSchema = [
  param("gameId").notEmpty().withMessage("Game ID is required"),
  body("marketName")
    .notEmpty().withMessage("Market name is required")
    .isString().withMessage("Market name must be a string"),
  body("participants")
    .notEmpty().withMessage("Participants is required")
    .isInt({ min: 1 }).withMessage("Participants must be a positive integer"),
  body("startTime")
    .notEmpty().withMessage("Start time is required"),
  body("endTime")
    .notEmpty().withMessage("End time is required")
];

export const createdRunnerSchema = [
  param("marketId").notEmpty().withMessage("Market ID is required"),
  body("runners")
    .isArray().withMessage("Runners must be an array")
    .notEmpty().withMessage("Runners array cannot be empty")
];

export const createdRateSchema = [
  param("runnerId").notEmpty().withMessage("Runner ID is required"),
  body("back")
    .optional()
    .isNumeric()
    .withMessage("Back rate must be a numeric value"),
  body("lay")
    .optional()
    .isNumeric()
    .withMessage("Lay rate must be a numeric value"),
];

export const suspendedMarketSchema = [
  param("marketId").notEmpty().withMessage("Market ID is required"),
  body("status").isBoolean().withMessage("Status must be a boolean value"),
];

export const updateGameSchema = [
  body("gameId").notEmpty().withMessage("Game ID is required"),
  body("gameName")
    .optional()
    .notEmpty()
    .withMessage("Game name cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Description cannot be empty"),
];

export const updateMarketSchema = [
  body("marketId").notEmpty().withMessage("Market ID is required"),
  body("marketName")
    .optional()
    .notEmpty()
    .withMessage("Market name cannot be empty"),
  body("participants")
    .optional()
    .notEmpty()
    .withMessage("Participants is required"),
];

export const updateRunnerSchema = [
  body("runnerId").notEmpty().withMessage("Runner ID is required"),
  body("runnerName")
    .optional()
    .notEmpty()
    .withMessage("Runner name cannot be empty"),
];

export const updateRateSchema = [
  body("runnerId").notEmpty().withMessage("Runner ID is required"),
  body("back").optional().isNumeric().withMessage("Back rate must be a number"),
  body("lay").optional().isNumeric().withMessage("Lay rate must be a number"),
];

export const announcementsSchema = [
  body("typeOfAnnouncement")
    .notEmpty()
    .withMessage("Type of announcement is required"),
  body("announcement")
    .notEmpty()
    .withMessage("Announcement content is required"),
];

export const updateAnnouncementSchema = [
  param("announceId").notEmpty().withMessage("Announcement ID is required"),
  body("typeOfAnnouncement")
    .optional()
    .notEmpty()
    .withMessage("Type of announcement is required"),
  body("announcement")
    .optional()
    .notEmpty()
    .withMessage("Announcement content is required"),
];

export const depositSchema = [
  body("adminId").notEmpty().withMessage("Admin ID is required"),
  body("depositAmount")
    .notEmpty()
    .withMessage("Deposit amount is required")
    .isNumeric()
    .withMessage("Deposit amount must be a numeric value")
    .custom((value) => parseFloat(value) > 0)
    .withMessage("Deposit amount must be greater than 0"),
];

export const sendBalanceSchema = [
  body("balance")
    .notEmpty()
    .withMessage("Balance is required")
    .isNumeric()
    .withMessage("Balance must be a numeric value")
    .custom((value) => parseFloat(value) > 0)
    .withMessage("Balance must be greater than 0"),
  body("adminId").notEmpty().withMessage("Admin ID is required"),
  body("userId").notEmpty().withMessage("User ID is required"),
];

export const userLoginSchema = [
  body("userName").notEmpty().withMessage("User Name is required."),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 }),
];

export const eligibilityCheckValidationRules = [
  body("eligibilityCheck")
    .isBoolean()
    .withMessage("Eligibility check must be a boolean value"),
];

export const gameIdValidate = [
  param("gameId")
    .notEmpty()
    .withMessage("Game ID cannot be empty")
    .isString()
    .withMessage("Game ID must be a string"),
];

export const validateGameId = [
  param("gameId").notEmpty().withMessage("Game ID cannot be empty"),
];

export const validateAnnouncementsId = [
  param("announceId").notEmpty().withMessage("Announcement ID is required"),
];

export const validateUserResetPassword = [
  body("oldPassword").notEmpty().withMessage("Old Password is required"),
  body("password")
    .notEmpty()
    .withMessage("New Password is required")
    .isLength({ min: 6 })
    .withMessage("New Password must be at least 6 characters long"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Confirm Password does not match with Password"),
];




export const exUpdateBalanceSchema = [
  body("userId").notEmpty().withMessage("user ID is required"),
  body("amount").notEmpty().withMessage("amount is required"),
  body("type")
    .notEmpty()
    .withMessage("type is required")
    .isIn(["credit", "debit"])
    .withMessage('type must be either "credit" or "debit".'),
];

export const userUpdateSchema = [
  param("userId").notEmpty().withMessage("User ID is required"),
  body("firstName").optional().notEmpty().withMessage("First name is required"),
  body("lastName").optional().notEmpty().withMessage("Last name is required"),
  body("userName").optional().notEmpty().withMessage("Username is required"),
  body("phoneNumber")
    .optional()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone()
    .withMessage("Invalid phone number format"),
  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("balance")
    .optional()
    .isNumeric()
    .withMessage("Balance must be a number"),
];

export const validateDeleteRunner = [
  param("runnerId").notEmpty().withMessage("Runner ID is required"),
];

export const calculateProfitLossSchema = [
  param("userName").notEmpty().withMessage("Username is required"),
];

export const marketProfitLossSchema = [
  param("userName").notEmpty().withMessage("Username is required"),
  param("gameId").notEmpty().withMessage("Game ID is required"),
];

export const runnerProfitLossSchema = [
  param("userName").notEmpty().withMessage("Username is required"),
  param("marketId").notEmpty().withMessage("Market ID is required"),
];

export const gameActiveInactiveValidate = [
  body("status")
    .notEmpty()
    .withMessage("Status is required.")
    .isBoolean()
    .withMessage("Status must be a boolean (true or false)."),
  body("gameId")
    .notEmpty()
    .withMessage("Game Id is required.")
    .isUUID(4)
    .withMessage("Game Id is not a valid."),
];

export const logOutValidate = [
  body("userId").notEmpty().withMessage("User ID is required.").isUUID(4).withMessage("User Id is not a valid."),
];

export const betHistorySchema = [
  param("userName")
    .notEmpty()
    .withMessage("Username is required."),
    param("gameId")
    .notEmpty()
    .withMessage("Game Id is required.")
];

export const createUserValidate = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("userName").optional().notEmpty().withMessage("Username is required"),
  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
]

export const calculateProfitLossValidate = [
  query("startDate")
    .notEmpty()
    .withMessage("Start date is required.")
    .isISO8601()
    .withMessage("Invalid start date format."),
  query("endDate")
    .notEmpty()
    .withMessage("End date is required.")
    .isISO8601()
    .withMessage("Invalid end date format."),
];

export const marketProfitLossValidate = [
  param("gameId").notEmpty().withMessage("Game ID is required"),
];

export const runnerProfitLossValidate= [
  param("marketId").notEmpty().withMessage("Market ID is required"),
];

export const validateUpdateGameStatus = [
  param('gameId').isUUID().withMessage('Game ID must be a valid UUID'),
  body('status').notEmpty().withMessage("status is required.").isBoolean().withMessage('Status must be a boolean'),
];

export const validatePurchaseLotteryTicket = [
  body('lotteryId')
    .isUUID()
    .withMessage('Invalid lottery ID. It must be a valid UUID.'),
];

export const validateVoidGame = [
  body('marketId').notEmpty().withMessage("Market Id is required.").isUUID().withMessage('Market ID must be a valid UUID'),
];

export const validateSearchTickets = [
  body('group').notEmpty().withMessage('Group is required').isInt({ min: 0 }).withMessage('Group must be a positive integer'),
  body('series').notEmpty().withMessage('Series is required').isLength({ min: 1, max: 1 }).withMessage('Series must be a single character'),
  body('number').notEmpty().withMessage('Number is required').isString().isLength({ min: 1 }).withMessage('Number must be a non-empty string'),
  body('sem')
  .notEmpty()
  .withMessage('Sem is required')
  .bail() 
  .isNumeric()
  .withMessage('Sem must be a numeric value')
  .bail() 
  .isIn([5, 10, 25, 50, 100, 200])
  .withMessage('Sem must be one of the following values: 5, 10, 25, 50, 100, 200'),
  body('marketId').notEmpty().withMessage('marketId is required').isUUID().withMessage('MarketId must be a valid UUID'),

];

export const validatePurchaseLottery = [
  param('marketId')
    .exists()
    .withMessage('Market ID is required')
    .isUUID()
    .withMessage('Market ID must be a valid UUID'),
  body('generateId')
    .exists()
    .withMessage('Generate ID is required')
    .isUUID()
    .withMessage('Generate ID must be a valid UUID'),
  body('lotteryPrice')
    .exists()
    .withMessage('Lottery price is required')
    .isNumeric()
    .withMessage('Lottery price must be a numeric value')
    .custom((value) => value > 0)
    .withMessage('Lottery price must be greater than zero'),
];

export const validatePurchaseHistory = [
  param('marketId')
    .exists()
    .withMessage('Market ID is required')
    .isUUID()
    .withMessage('Market ID must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer'),
  query('sem')
    .optional()
    .isInt()
    .withMessage('Sem must be an integer')
    .isIn([5, 10, 25, 50, 100, 200])
    .withMessage('Sem must be one of 5, 10, 25, 50, 100, 200'),
];

export const validateUpdateBalance = [
  body('userId')
    .exists()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('prizeAmount')
    .exists()
    .withMessage('Prize amount is required')
    .isInt()
    .withMessage('Prize amount must be a positive number'),
  body('marketId')
    .exists()
    .withMessage('Market ID is required')
    .isUUID()
    .withMessage('Market ID must be a valid UUID'),
];

export const validateRemoveExposer = [
  body('userId')
    .exists()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('marketId')
    .exists()
    .withMessage('Market ID is required')
    .isUUID()
    .withMessage('Market ID must be a valid UUID'),
  body('marketName')
    .exists()
    .withMessage('Market name is required')
    .isString()
    .withMessage('Market name must be a string')
    .notEmpty()
    .withMessage('Market name cannot be empty'),
];

export const validateMarketId = [
  param("marketId").notEmpty().withMessage('marketId is required')
    .isUUID()
    .withMessage("Invalid marketId. It should be a valid UUID."),
];


export const validateCreateLotteryP_L = [
  body('userId')
    .exists()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('userName')
    .exists()
    .withMessage('User name is required')
    .isString()
    .withMessage('User name must be a string')
    .isLength({ max: 255 })
    .withMessage('User name must not exceed 255 characters'),
  body('marketId')
    .exists()
    .withMessage('Market ID is required')
    .isUUID()
    .withMessage('Market ID must be a valid UUID'),
  body('marketName')
    .exists()
    .withMessage('Market name is required')
    .isString()
    .withMessage('Market name must be a string')
    .isLength({ max: 255 })
    .withMessage('Market name must not exceed 255 characters'),
  body('ticketNumber')
    .optional()
    .isArray()
    .withMessage('Ticket number must be an array')
    .custom((value) => value.every((item) => typeof item === 'string'))
    .withMessage('Each ticket number must be a string'),
  body('price')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Price must be a positive integer'),
  body('sem')
    .optional()
    .isInt({ values: [5, 10, 25, 50, 100, 200] })
    .withMessage('Sem must be one of the values: 5, 10, 25, 50, 100, 200'),
  body('profitLoss')
    .exists()
    .withMessage('Profit or loss is required')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Profit or loss must be a decimal with up to 2 digits after the decimal point'),
];

export const validateDateWiseMarkets = [
  query('date')
    .exists()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in a valid ISO 8601 format (e.g., YYYY-MM-DD)'),
];

export const validateGetLiveUserBet = [
  param("marketId")
    .trim()
    .notEmpty()
    .withMessage("Market ID is required.")
    .isUUID()
    .withMessage("Market ID must be a valid UUID."),
];