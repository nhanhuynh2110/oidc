import { UserManagerSettings } from 'oidc-client-ts';

const oidcConfig: UserManagerSettings = {
  authority: 'http://localhost:3000/oidc', // URL của nhà cung cấp OIDC
  client_id: 'client_id',
  client_secret: 'secret',
  redirect_uri: 'http://localhost:3001/callback', // URL callback của client React
  post_logout_redirect_uri: 'http://localhost:3001/',
  response_type: 'code',
  scope: 'openid profile',
  loadUserInfo: true,
};

export default oidcConfig;