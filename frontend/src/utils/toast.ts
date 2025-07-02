import { useToast as useChakraToast, UseToastOptions } from '@chakra-ui/react';

// Default toast configuration
const defaultToastConfig: UseToastOptions = {
  position: 'top-right',
  duration: 3000,
  isClosable: true,
};

// Custom hook that wraps Chakra's useToast with our default configuration
export const useToast = () => {
  const toast = useChakraToast();
  
  return (options: UseToastOptions) => {
    return toast({
      ...defaultToastConfig,
      ...options,
    });
  };
}; 