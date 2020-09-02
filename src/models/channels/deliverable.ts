import { Status } from '@src/models/userMessage';

class Deliverable {
  deliveredAt?: string;

  deliveredStatus?: string;

  setDelivered() {
    this.deliveredAt = new Date().toISOString();
    this.deliveredStatus = Status.DELIVERED;
  }
}

export default Deliverable;
