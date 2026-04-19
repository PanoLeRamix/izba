import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function NotFoundScreen() {
  const { houseId, houseToken, userId, userToken } = useAuthStore();
  const isLoggedIn = !!(houseId && houseToken && userId && userToken);

  return <Redirect href={isLoggedIn ? '/(main)' : '/(auth)'} />;
}
