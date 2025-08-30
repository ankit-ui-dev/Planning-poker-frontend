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
  Avatar,
  Badge,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaCrown, FaExclamationTriangle } from 'react-icons/fa';

interface Player {
  id: number;
  name: string;
  is_admin: boolean;
  role: string;
}

interface AdminPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromote: (playerId: number) => void;
  players: Player[];
  currentAdminName: string;
  isLoading?: boolean;
}

const AdminPromotionModal: React.FC<AdminPromotionModalProps> = ({
  isOpen,
  onClose,
  onPromote,
  players,
  currentAdminName,
  isLoading = false,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Filter out current admin and only show eligible players
  const eligiblePlayers = players.filter(player => !player.is_admin);

  const handlePromote = () => {
    if (selectedPlayerId) {
      onPromote(selectedPlayerId);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedPlayerId(null);
    setShowConfirmation(false);
    onClose();
  };

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setShowConfirmation(true);
  };

  const getSelectedPlayer = () => {
    return players.find(player => player.id === selectedPlayerId);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor} border="1px solid" borderColor={borderColor}>
        <ModalHeader color="primary.500" textAlign="center">
          <HStack spacing={2} justify="center">
            <FaCrown color="#805AD5" />
            <Text>Promote User to Admin</Text>
          </HStack>
        </ModalHeader>
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {!showConfirmation ? (
              <>
                <Text color="gray.600" textAlign="center">
                  Select a user to promote to admin. You will lose admin privileges.
                </Text>

                {eligiblePlayers.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>No eligible players</AlertTitle>
                    <AlertDescription>
                      All players in this room are already admins.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {eligiblePlayers.map((player) => (
                      <Button
                        key={player.id}
                        variant="outline"
                        size="lg"
                        onClick={() => handlePlayerSelect(player.id)}
                        justifyContent="flex-start"
                        p={4}
                        height="auto"
                        borderColor="gray.300"
                        _hover={{
                          borderColor: 'purple.500',
                          bg: 'purple.50',
                        }}
                      >
                        <HStack spacing={3} width="full">
                          <Avatar
                            size="md"
                            name={player.name}
                            bg="blue.500"
                            color="white"
                          />
                          <VStack spacing={1} align="start" flex={1}>
                            <Text fontWeight="medium" fontSize="md">
                              {player.name}
                            </Text>
                            <Badge colorScheme="blue" variant="subtle">
                              {player.role}
                            </Badge>
                          </VStack>
                          <FaCrown color="#805AD5" />
                        </HStack>
                      </Button>
                    ))}
                  </VStack>
                )}
              </>
            ) : (
              <VStack spacing={6} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <AlertTitle>Confirm Admin Transfer</AlertTitle>
                  <AlertDescription>
                    You are about to transfer admin privileges to{' '}
                    <strong>{getSelectedPlayer()?.name}</strong>. 
                    You will lose admin access and become a regular voter.
                  </AlertDescription>
                </Alert>

                <VStack spacing={4} p={4} bg="purple.50" borderRadius="md">
                  <HStack spacing={3}>
                    <Avatar
                      size="lg"
                      name={getSelectedPlayer()?.name}
                      bg="purple.500"
                      color="white"
                    />
                    <VStack spacing={1} align="start">
                      <Text fontWeight="bold" fontSize="lg" color="purple.700">
                        {getSelectedPlayer()?.name}
                      </Text>
                      <Badge colorScheme="purple" size="lg">
                        Will become Admin
                      </Badge>
                    </VStack>
                  </HStack>
                  
                  <Text fontSize="sm" color="purple.700" textAlign="center">
                    This action cannot be undone. The new admin will have full control over the room.
                  </Text>
                </VStack>

                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>What happens next?</AlertTitle>
                  <AlertDescription>
                    • {getSelectedPlayer()?.name} will gain admin privileges<br/>
                    • You will become a regular voter<br/>
                    • Only the new admin can manage the room
                  </AlertDescription>
                </Alert>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            {showConfirmation && (
              <Button
                colorScheme="purple"
                onClick={handlePromote}
                isLoading={isLoading}
                loadingText="Promoting..."
                leftIcon={<FaCrown />}
              >
                Confirm Promotion
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AdminPromotionModal; 