import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FaEye, FaUser, FaCrown } from 'react-icons/fa';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (name: string, role: string) => void;
  roomName: string;
  isLoading?: boolean;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  roomName,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('voter');
  const [nameError, setNameError] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError && value.trim()) {
      setNameError('');
    }
  };

  const handleJoin = () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    onJoin(name.trim(), role);
  };

  const handleClose = () => {
    setName('');
    setRole('voter');
    setNameError('');
    onClose();
  };

  const roleOptions = [
    {
      value: 'voter',
      label: 'Voter',
      description: 'Can participate in voting and submit cards',
      icon: FaUser,
      color: 'blue.500',
    },
    {
      value: 'visitor',
      label: 'Visitor',
      description: 'Read-only access, cannot vote',
      icon: FaEye,
      color: 'green.500',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent bg={bgColor} border="1px solid" borderColor={borderColor}>
        <ModalHeader color="primary.500" textAlign="center">
          Join {roomName}
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Name input */}
            <FormControl isInvalid={!!nameError}>
              <FormLabel color="primary.500">Your Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your name"
                size="lg"
                borderColor="primary.500"
                _focus={{
                  borderColor: 'primary.600',
                  boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
                }}
              />
              <FormErrorMessage>{nameError}</FormErrorMessage>
            </FormControl>

            {/* Role selection */}
            <FormControl>
              <FormLabel color="primary.500">Join as</FormLabel>
              <RadioGroup value={role} onChange={setRole}>
                <VStack spacing={4} align="stretch">
                  {roleOptions.map((option) => (
                    <Radio
                      key={option.value}
                      value={option.value}
                      size="lg"
                      colorScheme={option.color.split('.')[0] as any}
                    >
                      <HStack spacing={3} ml={2}>
                        <Icon as={option.icon} color={option.color} boxSize={5} />
                        <VStack spacing={1} align="start">
                          <Text fontWeight="medium" fontSize="md">
                            {option.label}
                          </Text>
                          <Text fontSize="sm" color="gray.600" maxW="300px">
                            {option.description}
                          </Text>
                        </VStack>
                      </HStack>
                    </Radio>
                  ))}
                </VStack>
              </RadioGroup>
            </FormControl>

            {/* Info box */}
            <VStack
              spacing={3}
              p={4}
              bg="blue.50"
              borderRadius="md"
              border="1px solid"
              borderColor="blue.200"
            >
              <HStack spacing={2}>
                <Icon as={FaCrown} color="purple.500" />
                <Text fontSize="sm" fontWeight="medium" color="purple.700">
                  Room Information
                </Text>
              </HStack>
              <Text fontSize="sm" color="blue.700" textAlign="center">
                {role === 'voter' 
                  ? 'You will be able to vote and participate in planning sessions.'
                  : 'You will have read-only access to observe the planning session.'
                }
              </Text>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleJoin}
              isLoading={isLoading}
              loadingText="Joining..."
              isDisabled={!name.trim()}
            >
              Join Room
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RoleSelectionModal; 