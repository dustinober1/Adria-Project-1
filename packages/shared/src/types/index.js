"use strict";
// Common types shared across frontend and backend
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InquiryStatus = exports.BlogPostStatus = void 0;
// Re-export user types from dedicated module
__exportStar(require("./user.types"), exports);
// Re-export auth types from dedicated module
__exportStar(require("./auth.types"), exports);
var BlogPostStatus;
(function (BlogPostStatus) {
    BlogPostStatus["DRAFT"] = "draft";
    BlogPostStatus["PUBLISHED"] = "published";
    BlogPostStatus["ARCHIVED"] = "archived";
})(BlogPostStatus || (exports.BlogPostStatus = BlogPostStatus = {}));
var InquiryStatus;
(function (InquiryStatus) {
    InquiryStatus["NEW"] = "new";
    InquiryStatus["IN_PROGRESS"] = "in_progress";
    InquiryStatus["RESPONDED"] = "responded";
    InquiryStatus["CLOSED"] = "closed";
})(InquiryStatus || (exports.InquiryStatus = InquiryStatus = {}));
//# sourceMappingURL=index.js.map