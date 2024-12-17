"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenId4VcIssuanceSessionState = void 0;
var OpenId4VcIssuanceSessionState;
(function (OpenId4VcIssuanceSessionState) {
    OpenId4VcIssuanceSessionState["OfferCreated"] = "OfferCreated";
    OpenId4VcIssuanceSessionState["OfferUriRetrieved"] = "OfferUriRetrieved";
    // Used with authorization code flow where Credo is the auth server
    OpenId4VcIssuanceSessionState["AuthorizationInitiated"] = "AuthorizationInitiated";
    OpenId4VcIssuanceSessionState["AuthorizationGranted"] = "AuthorizationGranted";
    // Used with pre-auth and auth code flow where Credo is the auth server
    OpenId4VcIssuanceSessionState["AccessTokenRequested"] = "AccessTokenRequested";
    OpenId4VcIssuanceSessionState["AccessTokenCreated"] = "AccessTokenCreated";
    OpenId4VcIssuanceSessionState["CredentialRequestReceived"] = "CredentialRequestReceived";
    OpenId4VcIssuanceSessionState["CredentialsPartiallyIssued"] = "CredentialsPartiallyIssued";
    OpenId4VcIssuanceSessionState["Completed"] = "Completed";
    OpenId4VcIssuanceSessionState["Error"] = "Error";
})(OpenId4VcIssuanceSessionState || (exports.OpenId4VcIssuanceSessionState = OpenId4VcIssuanceSessionState = {}));
//# sourceMappingURL=OpenId4VcIssuanceSessionState.js.map