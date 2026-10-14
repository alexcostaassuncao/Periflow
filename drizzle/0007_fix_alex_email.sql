UPDATE `employees` SET `email`='alexcosta@periferica.me'
WHERE `id`='connect-alex' AND `email`='alexcosta@perferica.me'
AND NOT EXISTS (SELECT 1 FROM `employees` WHERE `email`='alexcosta@periferica.me');
