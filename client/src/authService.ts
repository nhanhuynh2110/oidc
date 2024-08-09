import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import oidcConfig from './oidc-config';

const userManager = new UserManager(oidcConfig);

// Khởi tạo WebStorageStateStore nếu cần thiết
const stateStore = new WebStorageStateStore({ store: window.localStorage });

// Ví dụ về việc sử dụng stateStore trong các phương thức
userManager.events.addUserSignedOut(() => {
  stateStore.set('oidc-client:user:state', JSON.stringify({}));
});

export const login = () => userManager.signinRedirect();

export const handleCallback = async () => {
  try {
    const user = await userManager.signinRedirectCallback().catch(err => {
      console.error('Error:1111', err);
    });;
    console.log('User logged in', user);
    // Lưu thông tin người dùng và token vào state hoặc localStorage
  } catch (error) {
    console.error('Error handling OIDC callback', error);
  }
};

export const logout = () => userManager.signoutRedirect();
