import React from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  VStack,
  Divider,
  Badge,
} from '@chakra-ui/react';
import {
  FaHome,
  FaTrash,
  FaCrown,
  FaEye,
  FaShare,
  FaHistory,
  FaRedo,
  FaBars,
  FaUserPlus,
} from 'react-icons/fa';

interface TopMenuBarProps {
  roomName: string;
  isAdmin: boolean;
  onShowRoom: () => void;
  onDeleteRoom: () => void;
  onPromoteUser: () => void;
  onRevealVotes: () => void;
  onResetRoom: () => void;
  onShowHistory: () => void;
  onShareRoom: () => void;
  showHistory: boolean;
  canReveal: boolean;
  currentPlayerName: string;
  currentPlayerRole: string;
  onSwitchRoom: (roomCode: string) => void;
  userRooms: Array<{
    id: number;
    name: string;
    room_code: string;
    role: string;
    is_admin: boolean;
  }>;
}

const TopMenuBar: React.FC<TopMenuBarProps> = ({
  roomName,
  isAdmin,
  onShowRoom,
  onDeleteRoom,
  onPromoteUser,
  onRevealVotes,
  onResetRoom,
  onShowHistory,
  onShareRoom,
  showHistory,
  canReveal,
  currentPlayerName,
  currentPlayerRole,
  onSwitchRoom,
  userRooms,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'purple';
      case 'voter':
        return 'blue';
      case 'visitor':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <Box
      bg={bgColor}
      borderBottom="1px solid"
      borderColor={borderColor}
      px={6}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="sm"
    >
      <HStack justify="space-between" align="center" spacing={4}>
        {/* Left side - Room info and navigation */}
        <HStack spacing={4} flex={1}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FaHome />}
            onClick={onShowRoom}
            color={textColor}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          >
            {roomName}
          </Button>

          {/* Room switcher */}
          {userRooms.length > 1 && (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                size="sm"
                rightIcon={<FaBars />}
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              >
                Switch Room
              </MenuButton>
              <MenuList>
                {userRooms.map((room) => (
                  <MenuItem
                    key={room.id}
                    onClick={() => onSwitchRoom(room.room_code)}
                    icon={
                      <Avatar
                        size="xs"
                        name={room.name}
                        bg={room.is_admin ? 'purple.500' : getRoleColor(room.role) === 'blue' ? 'blue.500' : 'gray.500'}
                        color="white"
                      />
                    }
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {room.name}
                      </Text>
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="gray.500">
                          {room.is_admin ? 'Admin' : room.role}
                        </Text>
                        {room.is_admin && (
                          <Badge colorScheme="purple" size="xs">👑</Badge>
                        )}
                      </HStack>
                    </VStack>
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          )}
        </HStack>

        {/* Center - Main actions */}
        <HStack spacing={2}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FaHistory />}
            onClick={onShowHistory}
            color={textColor}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FaShare />}
            onClick={onShareRoom}
            color={textColor}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          >
            Share
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FaRedo />}
                onClick={onResetRoom}
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              >
                Reset
              </Button>

              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FaEye />}
                onClick={onRevealVotes}
                isDisabled={!canReveal}
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              >
                Reveal Votes
              </Button>

              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FaUserPlus />}
                onClick={onPromoteUser}
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              >
                Promote User
              </Button>

              <Divider orientation="vertical" height="20px" />

              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FaTrash />}
                onClick={onDeleteRoom}
                color="red.500"
                _hover={{ bg: useColorModeValue('red.50', 'red.900') }}
              >
                Delete Room
              </Button>
            </>
          )}
        </HStack>

        {/* Right side - Current user info */}
        <HStack spacing={3}>
          <VStack spacing={0} align="end">
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              {currentPlayerName}
            </Text>
            <HStack spacing={1}>
              <Text fontSize="xs" color="gray.500">
                {isAdmin ? 'Admin' : currentPlayerRole}
              </Text>
              {isAdmin && (
                <Badge colorScheme="purple" size="xs">👑</Badge>
              )}
            </HStack>
          </VStack>
          <Avatar
            size="sm"
            name={currentPlayerName}
            bg={isAdmin ? 'purple.500' : getRoleColor(currentPlayerRole) === 'blue' ? 'blue.500' : 'gray.500'}
            color="white"
          />
        </HStack>
      </HStack>
    </Box>
  );
};

export default TopMenuBar; 