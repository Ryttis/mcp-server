/**
 * IO layer for getTime tool.
 * Provides current time source.
 */
export const getTimeIO = {
    now() {
        return new Date();
    }
};
