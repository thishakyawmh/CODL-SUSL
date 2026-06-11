// Self-contained custom toast utility for the CODL portal

const injectStyles = () => {
    if (typeof document === 'undefined' || document.getElementById('custom-toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'custom-toast-styles';
    style.innerHTML = `
        #custom-toast-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        }

        .custom-toast-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: #FFFFFF;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
            pointer-events: auto;
            min-width: 320px;
            max-width: 450px;
            position: relative;
            overflow: hidden;
            animation: customToastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            transition: all 0.3s ease;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .custom-toast-card.fade-out {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
        }

        .custom-toast-card.success {
            border-left: 4px solid #10B981;
        }

        .custom-toast-card.error {
            border-left: 4px solid #EF4444;
        }

        .custom-toast-card.success .custom-toast-icon-wrapper {
            background: #ECFDF5;
            color: #10B981;
        }

        .custom-toast-card.error .custom-toast-icon-wrapper {
            background: #FEF2F2;
            color: #EF4444;
        }

        .custom-toast-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .custom-toast-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
        }

        .custom-toast-title {
            font-size: 14px;
            font-weight: 800;
            color: #1E293B;
            line-height: 1.2;
        }

        .custom-toast-message {
            font-size: 13px;
            font-weight: 500;
            color: #64748B;
            line-height: 1.4;
        }

        .custom-toast-close-btn {
            background: transparent;
            border: none;
            font-size: 20px;
            color: #94A3B8;
            cursor: pointer;
            padding: 4px;
            line-height: 1;
            transition: color 0.2s ease;
        }

        .custom-toast-close-btn:hover {
            color: #475569;
        }

        .custom-toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            width: 100%;
        }

        .custom-toast-card.success .custom-toast-progress {
            background: #10B981;
        }

        .custom-toast-card.error .custom-toast-progress {
            background: #EF4444;
        }

        @keyframes customToastSlideIn {
            from {
                transform: translateY(-20px) scale(0.9);
                opacity: 0;
            }
            to {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }

        @keyframes customToastProgress {
            from { width: 100%; }
            to { width: 0%; }
        }
    `;
    document.head.appendChild(style);
};

const getContainer = (): HTMLElement | null => {
    if (typeof document === 'undefined') return null;
    injectStyles();
    let container = document.getElementById('custom-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-toast-container';
        document.body.appendChild(container);
    }
    return container;
};

const createToastElement = (type: 'success' | 'error', message: string, duration: number = 4000) => {
    const container = getContainer();
    if (!container) return;

    const toastCard = document.createElement('div');
    toastCard.className = `custom-toast-card ${type}`;

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'custom-toast-icon-wrapper';
    
    if (type === 'success') {
        iconWrapper.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    } else {
        iconWrapper.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    }

    const content = document.createElement('div');
    content.className = 'custom-toast-content';

    const title = document.createElement('span');
    title.className = 'custom-toast-title';
    title.innerText = type === 'success' ? 'Success' : 'Error';

    const messageSpan = document.createElement('span');
    messageSpan.className = 'custom-toast-message';
    messageSpan.innerText = message;

    content.appendChild(title);
    content.appendChild(messageSpan);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'custom-toast-close-btn';
    closeBtn.innerHTML = '&times;';

    const progress = document.createElement('div');
    progress.className = 'custom-toast-progress';
    progress.style.animation = `customToastProgress ${duration}ms linear forwards`;

    toastCard.appendChild(iconWrapper);
    toastCard.appendChild(content);
    toastCard.appendChild(closeBtn);
    toastCard.appendChild(progress);

    container.appendChild(toastCard);

    const removeToast = () => {
        toastCard.classList.add('fade-out');
        setTimeout(() => {
            if (toastCard.parentNode === container) {
                container.removeChild(toastCard);
            }
        }, 300);
    };

    const timeoutId = setTimeout(removeToast, duration);

    closeBtn.onclick = () => {
        clearTimeout(timeoutId);
        removeToast();
    };
};

export const toast = {
    success: (message: string, duration?: number) => {
        createToastElement('success', message, duration);
    },
    error: (message: string, duration?: number) => {
        createToastElement('error', message, duration);
    }
};
