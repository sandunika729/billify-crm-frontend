import { useState, useCallback } from 'react';

export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    actions: []
  });

  const showContextMenu = useCallback((e, actions) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      actions
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    contextMenu,
    showContextMenu,
    closeContextMenu
  };
}
