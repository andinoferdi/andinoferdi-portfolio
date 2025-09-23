"use client";

import React, { useState } from 'react';
import { IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';

interface AlertState {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  description: string;
}

interface WindowWithAlert extends Window {
  __alertResolve?: (value: boolean) => void;
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'success',
    title: '',
    description: ''
  });

  const showAlert = (type: AlertState['type'], title: string, description: string) => {
    setAlert({ show: true, type, title, description });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  const confirmAlert = (title: string, description: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlert({
        show: true,
        type: 'warning',
        title,
        description
      });
      
      // Store resolve function for later use
      (window as WindowWithAlert).__alertResolve = resolve;
    });
  };

  const AlertComponent = () => {
    if (!alert.show) return null;

    const getColorClasses = () => {
      switch (alert.type) {
        case 'success': 
          return {
            bg: 'bg-green-500',
            text: 'text-green-800',
            border: 'border-green-200',
            button: 'bg-green-600 hover:bg-green-700'
          };
        case 'error': 
          return {
            bg: 'bg-red-500',
            text: 'text-red-800',
            border: 'border-red-200',
            button: 'bg-red-600 hover:bg-red-700'
          };
        case 'warning': 
          return {
            bg: 'bg-yellow-500',
            text: 'text-yellow-800',
            border: 'border-yellow-200',
            button: 'bg-yellow-600 hover:bg-yellow-700'
          };
        default: 
          return {
            bg: 'bg-blue-500',
            text: 'text-blue-800',
            border: 'border-blue-200',
            button: 'bg-blue-600 hover:bg-blue-700'
          };
      }
    };

    const getIcon = () => {
      switch (alert.type) {
        case 'success': return React.createElement(IconCheck, { size: 20 });
        case 'error': return React.createElement(IconX, { size: 20 });
        case 'warning': return React.createElement(IconAlertTriangle, { size: 20 });
        default: return null;
      }
    };

    const colors = getColorClasses();

    return React.createElement('div', {
      className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    }, React.createElement('div', {
      className: `w-[min(90vw,400px)] mx-4 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border ${colors.border}`
    }, 
      React.createElement('div', {
        className: `flex items-center gap-3 p-4 border-b ${colors.border}`
      },
        React.createElement('div', {
          className: `p-2 rounded-lg ${colors.bg} text-white`
        }, getIcon()),
        React.createElement('h3', {
          className: `text-lg font-semibold ${colors.text}`
        }, alert.title)
      ),
      React.createElement('div', {
        className: "p-4"
      },
        React.createElement('p', {
          className: "text-gray-700 dark:text-gray-300 mb-4"
        }, alert.description),
        alert.type === 'warning' ? 
          React.createElement('div', {
            className: "flex gap-2 justify-end"
          }, 
            React.createElement('button', {
              onClick: () => {
                hideAlert();
                const windowWithAlert = window as WindowWithAlert;
                if (windowWithAlert.__alertResolve) {
                  windowWithAlert.__alertResolve(true);
                  delete windowWithAlert.__alertResolve;
                }
              },
              className: "px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            }, 'Yes'),
            React.createElement('button', {
              onClick: () => {
                hideAlert();
                const windowWithAlert = window as WindowWithAlert;
                if (windowWithAlert.__alertResolve) {
                  windowWithAlert.__alertResolve(false);
                  delete windowWithAlert.__alertResolve;
                }
              },
              className: "px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
            }, 'No')
          ) : 
          React.createElement('div', {
            className: "flex justify-end"
          },
            React.createElement('button', {
              onClick: hideAlert,
              className: `px-4 py-2 ${colors.button} text-white rounded-md text-sm transition-colors`
            }, 'OK')
          )
      )
    ));
  };

  return {
    showAlert,
    hideAlert,
    confirmAlert,
    AlertComponent
  };
};