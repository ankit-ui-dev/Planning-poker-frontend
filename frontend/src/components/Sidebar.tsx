import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Divider,
  useColorModeValue,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FaHome, FaCrown, FaUser, FaEye } from 'react-icons/fa';

interface Room {
  id: number;
  name: string;
  description?: string;
  room_code: string;
  role: string;
  is_admin: boolean;
  created_at: string;
}

interface SidebarProps {
  userRooms: Room[];
  currentRoomCode: string;
  onRoomSelect: (roomCode: string) => void;
  onHomeClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userRooms,
  currentRoomCode,
  onRoomSelect,
  onHomeClick,
  isCollapsed,
  onToggleCollapse,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const getRoleIcon = (role: string, isAdmin: boolean) => {
    if (isAdmin) return <FaCrown color="#805AD5" />;
    if (role === 'voter') return <FaUser color="#3182CE" />;
    if (role === 'visitor') return <FaEye color="#38A169" />;
    return <FaUser color="#718096" />;
  };

  const getRoleColor = (role: string, isAdmin: boolean) => {
    if (isAdmin) return 'purple';
    if (role === 'voter') return 'blue';
    if (role === 'visitor') return 'green';
    return 'gray';
  };

  const getRoleLabel = (role: string, isAdmin: boolean) => {
    if (isAdmin) return 'Admin';
    if (role === 'voter') return 'Voter';
    if (role === 'visitor') return 'Visitor';
    return 'Member';
  };

  return (
    <Box
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      width={isCollapsed ? '60px' : '280px'}
      height="100vh"
      position="fixed"
      left={0}
      top={0}
      zIndex={5}
      transition="width 0.3s ease"
      overflow="hidden"
    >
      <VStack spacing={0} align="stretch" height="full">
        {/* Header */}
        <Box
          p={4}
          borderBottom="1px solid"
          borderColor={borderColor}
          bg={useColorModeValue('gray.50', 'gray.700')}
        >
          <HStack justify="space-between" align="center">
            {!isCollapsed && (
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={textColor}
                noOfLines={1}
              >
                My Rooms
              </Text>
            )}
            <IconButton
              aria-label="Toggle sidebar"
              icon={isCollapsed ? <FaHome /> : <FaHome />}
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              color={textColor}
            />
          </HStack>
        </Box>

        {/* Home button */}
        <Box p={2}>
          <Tooltip
            label="Home"
            placement="right"
            isDisabled={!isCollapsed}
          >
            <Box
              p={3}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onClick={onHomeClick}
              textAlign={isCollapsed ? 'center' : 'left'}
            >
              <HStack spacing={3} justify={isCollapsed ? 'center' : 'flex-start'}>
                <FaHome color="#2B4D46" />
                {!isCollapsed && (
                  <Text color={textColor} fontWeight="medium">
                    Home
                  </Text>
                )}
              </HStack>
            </Box>
          </Tooltip>
        </Box>

        <Divider />

        {/* Rooms list */}
        <VStack spacing={0} align="stretch" flex={1} overflowY="auto">
          {userRooms.map((room) => {
            const isActive = room.room_code === currentRoomCode;
            const isCurrentRoom = room.room_code === currentRoomCode;
            
            return (
              <Tooltip
                key={room.id}
                label={`${room.name} - ${getRoleLabel(room.role, room.is_admin)}`}
                placement="right"
                isDisabled={!isCollapsed}
              >
                <Box
                  p={3}
                  cursor="pointer"
                  bg={isCurrentRoom ? useColorModeValue('blue.50', 'blue.900') : 'transparent'}
                  borderLeft="3px solid"
                  borderLeftColor={isCurrentRoom ? 'blue.500' : 'transparent'}
                  _hover={{ bg: isCurrentRoom ? undefined : hoverBg }}
                  onClick={() => onRoomSelect(room.room_code)}
                  transition="all 0.2s"
                >
                  <HStack spacing={3} justify={isCollapsed ? 'center' : 'flex-start'}>
                    <Avatar
                      size="sm"
                      name={room.name}
                      bg={getRoleColor(room.role, room.is_admin) + '.500'}
                      color="white"
                    />
                    {!isCollapsed && (
                      <VStack spacing={1} align="start" flex={1} minW={0}>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color={textColor}
                          noOfLines={1}
                        >
                          {room.name}
                        </Text>
                        <HStack spacing={2}>
                          {getRoleIcon(room.role, room.is_admin)}
                          <Badge
                            size="sm"
                            colorScheme={getRoleColor(room.role, room.is_admin)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {getRoleLabel(room.role, room.is_admin)}
                          </Badge>
                        </HStack>
                      </VStack>
                    )}
                  </HStack>
                </Box>
              </Tooltip>
            );
          })}
        </VStack>

        {/* Footer */}
        {!isCollapsed && (
          <Box
            p={4}
            borderTop="1px solid"
            borderColor={borderColor}
            bg={useColorModeValue('gray.50', 'gray.700')}
          >
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {userRooms.length} room{userRooms.length !== 1 ? 's' : ''}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Sidebar; 