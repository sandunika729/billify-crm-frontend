import { useAuth } from '../context/AuthContext';

export default function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permissionString) => {
    if (!user) return false;
    
    
    if (Array.isArray(user.roles) && typeof user.roles[0] === 'string') {
      if (user.roles.includes('super_admin')) return true;
      return user.permissions?.includes(permissionString);
    }
    
    
    if (Array.isArray(user.roles) && typeof user.roles[0] === 'object') {
      const isSuper = user.roles.some(r => r.slug === 'super_admin');
      if (isSuper) return true;
      
      const [mod, act] = permissionString.split(':');
      for (const role of user.roles) {
        if (role.permissions?.some(p => p.module === mod && p.action === act)) {
          return true;
        }
      }
    }
    
    return false;
  };

  return { hasPermission };
}
