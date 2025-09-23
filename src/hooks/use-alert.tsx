"use client";

import React, { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  useDisclosure 
} from '@heroui/react';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

interface AlertState {
  type: 'success' | 'error' | 'warning';
  title: string;
  description: string;
}

interface WindowWithAlert extends Window {
  __alertResolve?: (value: boolean) => void;
}

interface UseAlertReturn {
  showAlert: (type: AlertState['type'], title: string, description: string) => void;
  hideAlert: () => void;
  confirmAlert: (title: string, description: string) => Promise<boolean>;
  AlertComponent: React.ComponentType;
}

export const useAlert = (): UseAlertReturn => {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const showAlert: UseAlertReturn['showAlert'] = (type, title, description) => {
    setAlert({ type, title, description });
    onOpen();
  };

  const hideAlert: UseAlertReturn['hideAlert'] = () => {
    onOpenChange();
    setAlert(null);
  };

  const confirmAlert: UseAlertReturn['confirmAlert'] = (title, description) => {
    return new Promise((resolve) => {
      setAlert({ type: 'warning', title, description });
      (window as WindowWithAlert).__alertResolve = resolve;
      onOpen();
    });
  };

  const getModalProps = () => {
    if (!alert) return { color: 'default' };
    
    switch (alert.type) {
      case 'success': return { color: 'success' };
      case 'error': return { color: 'danger' };
      case 'warning': return { color: 'warning' };
      default: return { color: 'default' };
    }
  };

  const getIcon = () => {
    if (!alert) return null;
    
    switch (alert.type) {
      case 'success': return <IconCheck size={20} />;
      case 'error': return <IconX size={20} />;
      case 'warning': return <IconAlertTriangle size={20} />;
      default: return null;
    }
  };

  const AlertComponent: UseAlertReturn['AlertComponent'] = () => {
    if (!alert) return null;

    return (
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        backdrop="blur"
        placement="center"
        size="sm"
        classNames={{
          backdrop: "bg-black/60 backdrop-blur-sm",
          base: "bg-neutral-900 border border-neutral-800 shadow-2xl",
          header: "border-b border-neutral-800 bg-neutral-900",
          body: "bg-neutral-900 text-gray-300",
          footer: "border-t border-neutral-800 bg-neutral-900 justify-end gap-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row items-center gap-3 px-6 py-4">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'success' ? 'bg-green-500' :
                  alert.type === 'error' ? 'bg-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                } text-white flex items-center justify-center`}>
                  {getIcon()}
                </div>
                <span className="text-lg font-semibold text-white">{alert.title}</span>
              </ModalHeader>
              
              <ModalBody className="px-6 py-4">
                <p className="text-gray-300 leading-relaxed">
                  {alert.description}
                </p>
              </ModalBody>
              
              <ModalFooter className="px-6 py-4">
                {alert.type === 'warning' ? (
                  <>
                    <Button
                      color="default"
                      variant="solid"
                      onPress={() => {
                        const windowWithAlert = window as WindowWithAlert;
                        if (windowWithAlert.__alertResolve) {
                          windowWithAlert.__alertResolve(false);
                          delete windowWithAlert.__alertResolve;
                        }
                        onClose();
                        setAlert(null);
                      }}
                      className="bg-gray-600 text-white hover:bg-gray-700 px-6 py-2 min-w-[80px]"
                    >
                      No
                    </Button>
                    <Button
                      color="danger"
                      variant="solid"
                      onPress={() => {
                        const windowWithAlert = window as WindowWithAlert;
                        if (windowWithAlert.__alertResolve) {
                          windowWithAlert.__alertResolve(true);
                          delete windowWithAlert.__alertResolve;
                        }
                        onClose();
                        setAlert(null);
                      }}
                      className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 min-w-[80px]"
                    >
                      Yes
                    </Button>
                  </>
                ) : (
                  <Button
                    color={getModalProps().color as "success" | "danger" | "warning" | "default"}
                    variant="solid"
                    onPress={() => {
                      onClose();
                      setAlert(null);
                    }}
                    className="px-6 py-2 min-w-[80px]"
                  >
                    OK
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  };

  const result = {
    showAlert,
    hideAlert,
    confirmAlert,
    AlertComponent
  };

  return result;
};